import { CardIds } from '@firestone-hs/reference-data';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { BoardSecret } from '../../../../models/decktracker/board-secret';
import { DeckState } from '../../../../models/decktracker/deck-state';
import { GameState } from '../../../../models/decktracker/game-state';
import { GameEvent } from '../../../../models/game-event';
import { DeckManipulationHelper } from '../deck-manipulation-helper';
import { EventParser } from '../event-parser';

export class TriggerOnTurnEndSecretsParser implements EventParser {
	private secretsTriggeringOnTurnEnd = [
		CardIds.Collectible.Mage.RiggedFaireGame,
		CardIds.Collectible.Rogue.Plagiarize,
	];

	constructor(private readonly helper: DeckManipulationHelper, private readonly allCards: AllCardsService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.gameState && gameEvent.type === GameEvent.TURN_START;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [, , localPlayer] = gameEvent.parse();
		const activePlayerId = gameEvent.gameState.ActivePlayerId;
		// Can happen at the very start of the game
		if (!localPlayer) {
			// console.log('[secret-turn-end] no local player, returning', gameEvent);
			return currentState;
		}

		// The activePlayerId is in fact the other player, because we are using the "turn_start"
		// as a proxy for the other player's turn_end
		const isPlayerActive = activePlayerId === localPlayer.PlayerId;
		const deckWithSecretToCheck = isPlayerActive ? currentState.playerDeck : currentState.opponentDeck;
		const playerWhoseCardsPlayedToCheck = !isPlayerActive ? currentState.playerDeck : currentState.opponentDeck;
		// console.log('[secret-turn-end] ndekc with secret', deckWithSecretToCheck);
		// console.log('[secret-turn-end] playerWhoseCardsPlayedToCheck', playerWhoseCardsPlayedToCheck);
		const secretsWeCantRuleOut = [];

		const isHandFull = deckWithSecretToCheck.hand.length >= 10;
		if (isHandFull) {
			// console.log('[secret-turn-end] hand full');
			secretsWeCantRuleOut.push(CardIds.Collectible.Rogue.Plagiarize);
		}

		const hasOpponentPlayedCards = playerWhoseCardsPlayedToCheck.cardsPlayedThisTurn.length > 0;
		// console.log('[secret-turn-end] cards played this turn', playerWhoseCardsPlayedToCheck.cardsPlayedThisTurn);
		if (!hasOpponentPlayedCards) {
			secretsWeCantRuleOut.push(CardIds.Collectible.Rogue.Plagiarize);
		}

		const hasHeroTakenDamage = deckWithSecretToCheck.damageTakenThisTurn > 0;
		if (hasHeroTakenDamage) {
			secretsWeCantRuleOut.push(CardIds.Collectible.Mage.RiggedFaireGame);
		}

		const optionsToFlagAsInvalid = this.secretsTriggeringOnTurnEnd.filter(
			(secret) => secretsWeCantRuleOut.indexOf(secret) === -1,
		);

		let secrets: BoardSecret[] = [...deckWithSecretToCheck.secrets];
		for (const secret of optionsToFlagAsInvalid) {
			// console.log('marking as invalid', secret, secrets);
			secrets = [...this.helper.removeSecretOptionFromSecrets(secrets, secret)];
			// console.log('marked as invalid', secret, newPlayerDeck);
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
