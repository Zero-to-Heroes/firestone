import { CardType } from '@firestone-hs/reference-data';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { GameState } from '../../../../models/decktracker/game-state';
import { GameEvent } from '../../../../models/game-event';
import { DeckManipulationHelper } from '../deck-manipulation-helper';
import { EventParser } from '../event-parser';

export class CatTrickSecretParser implements EventParser {
	private readonly secretCardId = 'KAR_004';

	constructor(private readonly helper: DeckManipulationHelper, private readonly allCards: AllCardsService) {}

	// Whenever something occurs that publicly reveal a card, we try to assign its
	// cardId to the corresponding entity
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.CARD_PLAYED;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, playedCardControllerId, localPlayer, entityId] = gameEvent.parse();
		const activePlayerId = gameEvent.gameState.ActivePlayerId;
		// Secret doesn't trigger if you're the one playing the minion
		if (activePlayerId === playedCardControllerId) {
			return currentState;
		}

		const isPlayerWithCardPlayed = playedCardControllerId === localPlayer.PlayerId;
		const deckWithSecretToCheck = isPlayerWithCardPlayed ? currentState.opponentDeck : currentState.playerDeck;
		const dbCard = this.allCards.getCard(cardId);
		if (!dbCard || !dbCard.type || dbCard.type.toLowerCase() !== CardType[CardType.SPELL].toLowerCase()) {
			return currentState;
		}
		// Might need to be a little more specific than this? E.g. with dormant minions?
		// It's an edge case, so leaving it aside for a first implementation
		if (deckWithSecretToCheck.board.length === 7) {
			return currentState;
		}
		const newPlayerDeck = this.helper.removeSecretOption(deckWithSecretToCheck, this.secretCardId);
		return Object.assign(new GameState(), currentState, {
			[isPlayerWithCardPlayed ? 'opponentDeck' : 'playerDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return 'SECRET_CAT_TRICK';
	}
}
