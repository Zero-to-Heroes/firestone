import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class MinionDiedParser implements EventParser {
	constructor(private readonly helper: DeckManipulationHelper) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.MINION_DIED;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const card = this.helper.findCardInZone(deck.board, cardId, entityId);
		const cardWithZone = card.update({
			zone: 'GRAVEYARD',
			entityId: -card.entityId, // If we keep the same entityId, our safeguards prevent us from adding it twice to the other zone
		} as DeckCard);
		//console.log('cardWithZone', cardWithZone);

		const newBoard: readonly DeckCard[] = this.helper.removeSingleCardFromZone(deck.board, cardId, entityId)[0];
		//console.log('newBoard', newBoard);
		const newOther: readonly DeckCard[] = this.helper.addSingleCardToZone(deck.otherZone, cardWithZone);
		//console.log('newOther', newOther);
		const newPlayerDeck = Object.assign(new DeckState(), deck, {
			board: newBoard,
			otherZone: newOther,
		} as DeckState);
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.MINION_DIED;
	}
}
