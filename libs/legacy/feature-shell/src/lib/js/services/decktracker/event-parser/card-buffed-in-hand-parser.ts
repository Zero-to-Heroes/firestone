import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class CardBuffedInHandParser implements EventParser {
	constructor(private readonly helper: DeckManipulationHelper) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		try {
			const buffingEntityCardId = gameEvent.additionalData.buffingEntityCardId;
			const buffCardIds = gameEvent.additionalData.buffCardId;
			return handleBuff(currentState, gameEvent, buffingEntityCardId, buffCardIds, this.helper);
		} catch (e) {
			// Safeguard in case the C# plugin isn't updated at the same time as the JS part
			// and still returns single cardIds
			console.warn('Could not process card buffed in hand event', e);
			return currentState;
		}
	}

	event(): string {
		return GameEvent.CARD_BUFFED_IN_HAND;
	}
}

export const handleBuff = (
	currentState: GameState,
	gameEvent: GameEvent,
	buffingEntityCardId: string,
	buffCardIds: readonly string[],
	helper: DeckManipulationHelper,
) => {
	if (!buffCardIds?.length) {
		return currentState;
	}

	const [, controllerId, localPlayer, entityId] = gameEvent.parse();
	const isPlayer = controllerId === localPlayer.PlayerId;
	const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
	const cardInHand = helper.findCardInZone(deck.hand, null, entityId);
	let newState = currentState;
	for (const buffCardId of buffCardIds) {
		newState = handleSingleCardBuffInHand(newState, gameEvent, buffingEntityCardId, buffCardId, helper, cardInHand);
	}
	return newState;
};

export const handleSingleCardBuffInHand = (
	currentState: GameState,
	gameEvent: GameEvent,
	buffingEntityCardId: string,
	buffCardId: string,
	helper: DeckManipulationHelper,
	cardToBuff: DeckCard,
) => {
	const [, controllerId, localPlayer, entityId] = gameEvent.parse();
	const isPlayer = controllerId === localPlayer.PlayerId;
	const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
	const newCardInHand = cardToBuff
		? cardToBuff.update({
				buffingEntityCardIds: [
					...(cardToBuff.buffingEntityCardIds || []),
					buffingEntityCardId,
				] as readonly string[],
				buffCardIds: [...(cardToBuff.buffCardIds || []), buffCardId] as readonly string[],
		  } as DeckCard)
		: null;

	const newHand = newCardInHand ? helper.replaceCardInZone(deck.hand, newCardInHand) : deck.hand;
	const newPlayerDeck = Object.assign(new DeckState(), deck, {
		hand: newHand,
	});
	return Object.assign(new GameState(), currentState, {
		[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
	});
};
