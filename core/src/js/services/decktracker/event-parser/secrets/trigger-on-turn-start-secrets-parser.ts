import { CardIds } from '@firestone-hs/reference-data';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { BoardSecret } from '../../../../models/decktracker/board-secret';
import { DeckState } from '../../../../models/decktracker/deck-state';
import { GameState } from '../../../../models/decktracker/game-state';
import { GameEvent } from '../../../../models/game-event';
import { DeckManipulationHelper } from '../deck-manipulation-helper';
import { EventParser } from '../event-parser';

export class TriggerOnTurnStartSecretsParser implements EventParser {
	private secretsTriggeringOnTurnStart = [
		CardIds.Collectible.Paladin.CompetitiveSpirit1,
		CardIds.Collectible.Hunter.OpenTheCages,
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
			// console.log('[turn-start] no local player, returning', gameEvent);
			return currentState;
		}

		const isPlayerActive = activePlayerId === localPlayer.PlayerId;
		const deckWithSecretToCheck = isPlayerActive ? currentState.playerDeck : currentState.opponentDeck;
		const secretsWeCantRuleOut = [];

		const isBoardEmpty = deckWithSecretToCheck.board.length === 0;
		if (isBoardEmpty) {
			// console.log('[turn-start] board empty', deckWithSecretToCheck, isPlayerActive, gameEvent);
			secretsWeCantRuleOut.push(CardIds.Collectible.Paladin.CompetitiveSpirit1);
		}

		// Only triggers if board has between 2 and 6 minions
		if (
			deckWithSecretToCheck.board.filter((entity) => !entity.dormant).length < 2 ||
			deckWithSecretToCheck.board.length === 7
		) {
			secretsWeCantRuleOut.push(CardIds.Collectible.Hunter.OpenTheCages);
		}

		const optionsToFlagAsInvalid = this.secretsTriggeringOnTurnStart.filter(
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
		return 'SECRET_TURN_START';
	}
}
