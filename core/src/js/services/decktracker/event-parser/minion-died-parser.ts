import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { MinionsDiedEvent } from '../../../models/mainwindow/game-events/minions-died-event';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class MinionDiedParser implements EventParser {
	constructor(private readonly helper: DeckManipulationHelper) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.MINIONS_DIED;
	}

	async parse(currentState: GameState, gameEvent: MinionsDiedEvent): Promise<GameState> {
		const [, , localPlayer] = gameEvent.parse();

		const deadMinions = gameEvent.additionalData.deadMinions;
		let result = currentState;
		for (const deadMinion of deadMinions) {
			// console.debug('handling dead minion', deadMinion);
			const cardId = deadMinion.CardId;
			const entityId = deadMinion.EntityId;
			const isPlayer = deadMinion.ControllerId === localPlayer?.PlayerId;
			const deck = isPlayer ? result.playerDeck : result.opponentDeck;
			const card = this.helper.findCardInZone(deck.board, cardId, entityId);
			const cardWithZone = card.update({
				zone: 'GRAVEYARD',
				entityId: -card.entityId, // If we keep the same entityId, our safeguards prevent us from adding it twice to the other zone
			} as DeckCard);
			//console.debug('cardWithZone', cardWithZone);

			const newBoard: readonly DeckCard[] = this.helper.removeSingleCardFromZone(deck.board, cardId, entityId)[0];
			//console.debug('newBoard', newBoard);
			const newOther: readonly DeckCard[] = this.helper.addSingleCardToZone(deck.otherZone, cardWithZone);
			//console.debug('newOther', newOther);
			const newPlayerDeck = Object.assign(new DeckState(), deck, {
				board: newBoard,
				otherZone: newOther,
			} as DeckState);
			result = Object.assign(new GameState(), result, {
				[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
			});
		}
		return result;
	}

	event(): string {
		return GameEvent.MINIONS_DIED;
	}
}
