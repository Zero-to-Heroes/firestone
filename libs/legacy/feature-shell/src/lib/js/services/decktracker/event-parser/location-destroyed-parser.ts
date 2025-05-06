import { DeckCard, GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../models/game-event';
import { MinionsDiedEvent } from '../../../models/mainwindow/game-events/minions-died-event';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class LocationDestroyedParser implements EventParser {
	constructor(private readonly helper: DeckManipulationHelper, private readonly allCards: CardsFacadeService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: MinionsDiedEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const card = this.helper.findCardInZone(deck.board, cardId, entityId);
		const cardWithZone = card.update({
			zone: 'SETASIDE',
			entityId: -card.entityId,
		} as DeckCard);
		const newBoard: readonly DeckCard[] = this.helper.removeSingleCardFromZone(deck.board, cardId, entityId)[0];
		const newOther: readonly DeckCard[] = this.helper.addSingleCardToOtherZone(deck, cardWithZone, this.allCards);
		const newPlayerDeck = deck.update({
			board: newBoard,
			otherZone: newOther,
		});
		const result = Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
			miscCardsDestroyed: [...(currentState.miscCardsDestroyed || []), cardId],
		});
		return result;
	}

	event(): string {
		return GameEvent.LOCATION_DESTROYED;
	}
}
