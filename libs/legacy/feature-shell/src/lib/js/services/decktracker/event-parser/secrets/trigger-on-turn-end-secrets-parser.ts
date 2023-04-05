import { CardIds } from '@firestone-hs/reference-data';
import { BoardSecret } from '../../../../models/decktracker/board-secret';
import { DeckState } from '../../../../models/decktracker/deck-state';
import { GameState } from '../../../../models/decktracker/game-state';
import { GameEvent } from '../../../../models/game-event';
import { DeckManipulationHelper } from '../deck-manipulation-helper';
import { EventParser } from '../event-parser';

export class TriggerOnTurnEndSecretsParser implements EventParser {
	private secretsTriggeringOnTurnEnd = [
		CardIds.RiggedFaireGame,
		CardIds.Plagiarize_CORE_SCH_706,
		CardIds.Plagiarize_SCH_706,
	];

	constructor(private readonly helper: DeckManipulationHelper) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.gameState && gameEvent.type === GameEvent.TURN_START;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [, , localPlayer] = gameEvent.parse();
		const activePlayerId = gameEvent.gameState.ActivePlayerId;
		// Can happen at the very start of the game
		if (!localPlayer) {
			return currentState;
		}

		// The activePlayerId is in fact the other player, because we are using the "turn_start"
		// as a proxy for the other player's turn_end
		const isPlayerActive = activePlayerId === localPlayer.PlayerId;
		const deckWithSecretToCheck = isPlayerActive ? currentState.playerDeck : currentState.opponentDeck;
		const playerWhoseCardsPlayedToCheck = !isPlayerActive ? currentState.playerDeck : currentState.opponentDeck;

		const secretsWeCantRuleOut = [];

		const isHandFull = deckWithSecretToCheck.hand.length >= 10;
		if (isHandFull) {
			secretsWeCantRuleOut.push(CardIds.Plagiarize_CORE_SCH_706);
			secretsWeCantRuleOut.push(CardIds.Plagiarize_SCH_706);
		}

		const hasOpponentPlayedCards = playerWhoseCardsPlayedToCheck.cardsPlayedThisTurn.length > 0;

		if (!hasOpponentPlayedCards) {
			secretsWeCantRuleOut.push(CardIds.Plagiarize_CORE_SCH_706);
			secretsWeCantRuleOut.push(CardIds.Plagiarize_SCH_706);
		}

		const hasHeroTakenDamage = deckWithSecretToCheck.damageTakenThisTurn > 0;
		if (hasHeroTakenDamage) {
			secretsWeCantRuleOut.push(CardIds.RiggedFaireGame);
		}

		const optionsToFlagAsInvalid = this.secretsTriggeringOnTurnEnd.filter(
			(secret) => secretsWeCantRuleOut.indexOf(secret) === -1,
		);

		let secrets: BoardSecret[] = [...deckWithSecretToCheck.secrets];
		for (const secret of optionsToFlagAsInvalid) {
			secrets = [...this.helper.removeSecretOptionFromSecrets(secrets, secret)];
		}
		const newPlayerDeck = deckWithSecretToCheck.update({
			secrets: secrets as readonly BoardSecret[],
		} as DeckState);
		return Object.assign(new GameState(), currentState, {
			[isPlayerActive ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return 'SECRET_TURN_END';
	}
}
