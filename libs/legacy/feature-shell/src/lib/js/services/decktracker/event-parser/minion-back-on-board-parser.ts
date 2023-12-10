import { DeckCard, DeckState, GameState } from '@firestone/game-state';
import { GameEvent } from '../../../models/game-event';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class MinionBackOnBoardParser implements EventParser {
	constructor(private readonly helper: DeckManipulationHelper) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		const creatorCardId = gameEvent.additionalData?.creatorCardId;

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const card = this.helper.findCardInZone(deck.otherZone, cardId, entityId);
		//console.debug('[minion-back-on-board] found card', card, cardId, entityId, deck.otherZone, deck.board);
		if (Math.abs(card?.entityId) !== Math.abs(entityId)) {
			return currentState;
		}

		const newOtherZone: readonly DeckCard[] = this.helper.removeSingleCardFromZone(
			deck.otherZone,
			cardId,
			entityId,
		)[0];
		//console.debug('[minion-back-on-board] new other zone', newOtherZone);
		const cardWithZone = card.update({
			zone: 'PLAY',
			creatorCardId: creatorCardId,
			temporaryCard: false,
			playTiming: GameState.playTiming++,
			putIntoPlay: true,
		} as DeckCard);
		//console.debug('[minion-back-on-board] card with zone', cardWithZone);

		const newBoard: readonly DeckCard[] = this.helper.addSingleCardToZone(deck.board, cardWithZone);
		const newPlayerDeck = Object.assign(new DeckState(), deck, {
			otherZone: newOtherZone,
			board: newBoard,
		} as DeckState);
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.MINION_BACK_ON_BOARD;
	}
}
