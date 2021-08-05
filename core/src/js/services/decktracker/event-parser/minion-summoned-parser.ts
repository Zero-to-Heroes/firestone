import { CardsFacadeService } from '@services/cards-facade.service';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class MinionSummonedParser implements EventParser {
	constructor(private readonly helper: DeckManipulationHelper, private readonly cards: CardsFacadeService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.MINION_SUMMONED;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		// console.log('parsing minion-summoned', gameEvent);
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		const creatorCardId = gameEvent.additionalData ? gameEvent.additionalData.creatorCardId : null;

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const dbCard = this.cards.getCard(cardId);
		const card = DeckCard.create({
			cardId: cardId,
			entityId: entityId,
			cardName: dbCard.name,
			manaCost: dbCard.cost,
			rarity: dbCard.rarity,
			creatorCardId: creatorCardId,
			zone: 'PLAY',
			temporaryCard: false,
		} as DeckCard);
		// console.log('adding card', card);

		const newBoard: readonly DeckCard[] = this.helper.addSingleCardToZone(deck.board, card);
		// console.log('new board', newBoard);
		const newPlayerDeck = Object.assign(new DeckState(), deck, {
			board: newBoard,
		} as DeckState);
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.MINION_SUMMONED;
	}
}
