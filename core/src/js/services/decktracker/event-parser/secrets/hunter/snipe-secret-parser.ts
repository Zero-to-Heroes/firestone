import { CardType } from '@firestone-hs/reference-data';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { GameState } from '../../../../../models/decktracker/game-state';
import { GameEvent } from '../../../../../models/game-event';
import { DeckManipulationHelper } from '../../deck-manipulation-helper';
import { EventParser } from '../../event-parser';

export class SnipeSecretParser implements EventParser {
	private readonly secretCardId = 'EX1_609';

	constructor(private readonly helper: DeckManipulationHelper, private readonly allCards: AllCardsService) {}

	// Whenever something occurs that publicly reveal a card, we try to assign its
	// cardId to the corresponding entity
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.CARD_PLAYED;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		const isMinionPlayedByPlayer = controllerId === localPlayer.PlayerId;
		const dbCard = this.allCards.getCard(cardId);
		if (!dbCard || !dbCard.type || dbCard.type.toLowerCase() !== CardType[CardType.MINION].toLowerCase()) {
			return currentState;
		}
		const deckWithSecretToCheck = isMinionPlayedByPlayer ? currentState.opponentDeck : currentState.playerDeck;
		const newPlayerDeck = this.helper.removeSecretOption(deckWithSecretToCheck, this.secretCardId);
		return Object.assign(new GameState(), currentState, {
			[isMinionPlayedByPlayer ? 'opponentDeck' : 'playerDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return 'SECRET_SNIPE';
	}
}
