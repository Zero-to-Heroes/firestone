/* eslint-disable no-mixed-spaces-and-tabs */
import { AllCardsService, CardIds } from '@firestone-hs/reference-data';
import { DeckCard } from '../../models/deck-card';
import { GameState } from '../../models/game-state';
import { GameEvent } from '../game-events/game-event';
import { ActionChainParser, ChainParsingCard } from './_card.type';

export const AlgalonsVision: ChainParsingCard = {
	cardIds: [CardIds.AlgalonTheObserver_AlgalonsVisionToken],
	chainParser: (allCards: AllCardsService) => new AlgalonsVisionParser(allCards),
};

export class AlgalonsVisionParser implements ActionChainParser {
	constructor(private readonly allCards: AllCardsService) {}

	public appliesOnEvent(): GameEvent['type'] {
		return GameEvent.ENTITY_CHOSEN;
	}

	public async parse(currentState: GameState, events: readonly GameEvent[]): Promise<GameState> {
		const reversedEvents = [...events].reverse();
		const lastEvent = reversedEvents.shift();
		if (lastEvent?.additionalData?.context?.creatorCardId !== CardIds.AlgalonTheObserver_AlgalonsVisionToken) {
			return currentState;
		}

		const isPlayer = lastEvent.controllerId === lastEvent.localPlayer.PlayerId;
		if (!isPlayer) {
			return currentState;
		}

		const cardRevealedEvent = reversedEvents.find(
			(e) =>
				e.type === GameEvent.CARD_REVEALED &&
				e.additionalData.creatorCardId === CardIds.AlgalonTheObserver_AlgalonsVisionToken &&
				![
					CardIds.AlgalonTheObserver_KeepOnTopToken_TTN_717t2,
					CardIds.AlgalonTheObserver_MoveToBottomToken_TTN_717t3,
				].includes(e.cardId as CardIds),
		);
		if (!cardRevealedEvent) {
			console.warn('[algalons-vision] no card revealed event found', lastEvent);
			return currentState;
		}

		const copiedFromEntityEvent = reversedEvents.find(
			(e) => e.type === GameEvent.COPIED_FROM_ENTITY_ID && e.entityId === cardRevealedEvent.entityId,
		);
		if (!copiedFromEntityEvent) {
			console.warn('[algalons-vision] no copied from entity event found', cardRevealedEvent);
			return currentState;
		}
		const entityId = copiedFromEntityEvent.additionalData.copiedCardEntityId;

		const deck = isPlayer ? currentState.opponentDeck : currentState.playerDeck;
		const card = deck.deck.find((e) => e.entityId === entityId);
		if (!card) {
			console.warn('[algalons-vision] no card found', entityId);
			return currentState;
		}

		let newCard = card;
		if (lastEvent.cardId === CardIds.AlgalonTheObserver_KeepOnTopToken_TTN_717t2) {
			newCard = newCard.update({
				positionFromBottom: undefined,
				positionFromTop: DeckCard.deckIndexFromTop--,
			});
		} else if (lastEvent.cardId === CardIds.AlgalonTheObserver_MoveToBottomToken_TTN_717t3) {
			newCard = newCard.update({
				positionFromBottom: DeckCard.deckIndexFromBottom++,
				positionFromTop: undefined,
			});
		}

		const newDeck = deck.deck.map((c) => (c.entityId === entityId ? newCard : c));
		const newDeckState = deck.update({
			deck: newDeck,
		});
		return currentState.update({
			[isPlayer ? 'opponentDeck' : 'playerDeck']: newDeckState,
		});
	}
}

const updateCards = <T extends DeckCard | string>(cards: readonly T[]): readonly T[] => {
	return cards.map((c) => {
		if (typeof c === 'string') {
			if (c === CardIds.LadyAzshara_TheWellOfEternityToken_TIME_211t1) {
				return CardIds.TheWellOfEternity_TheWellOfEternityToken_TIME_211t1t;
			} else if (c === CardIds.LadyAzshara_ZinAzshariToken_TIME_211t2) {
				return CardIds.ZinAzshari_ZinAzshariToken_TIME_211t2t;
			}
			return c;
		} else if (c instanceof DeckCard) {
			if (c.cardId === CardIds.LadyAzshara_TheWellOfEternityToken_TIME_211t1) {
				return c.update({
					cardId: CardIds.TheWellOfEternity_TheWellOfEternityToken_TIME_211t1t,
				});
			} else if (c.cardId === CardIds.LadyAzshara_ZinAzshariToken_TIME_211t2) {
				return c.update({
					cardId: CardIds.ZinAzshari_ZinAzshariToken_TIME_211t2t,
				});
			}
			return c;
		}
		return c;
	}) as readonly T[];
};
