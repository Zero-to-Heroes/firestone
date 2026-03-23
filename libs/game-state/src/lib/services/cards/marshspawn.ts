/* eslint-disable no-mixed-spaces-and-tabs */
// Marshspawn (BT_115) - 3 mana 3/4 Shaman Elemental
// Battlecry: If you cast a spell last turn, Discover a spell.
import { CardClass, CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import {
	GeneratingCard,
	GuessInfoInput,
	StaticGeneratingCard,
	StaticGeneratingCardInput,
	WillBeActiveCard,
	WillBeActiveInput,
} from './_card.type';
import { filterCards } from './utils';

export const Marshspawn: GeneratingCard & StaticGeneratingCard & WillBeActiveCard = {
	cardIds: [CardIds.Marshspawn_BT_115, CardIds.Marshspawn_CORE_BT_115],
	publicCreator: true,
	willBeActive: (input: WillBeActiveInput) => {
		return input.playerDeck.cardsPlayedLastTurn.some(
			(c) => input.allCards.getCard(c.cardId).type?.toUpperCase() === CardType[CardType.SPELL],
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const currentClass = input.deckState.getCurrentClass();
		const possibleCards = filterCards(
			Marshspawn.cardIds[0],
			input.allCards,
			(c) => c.type?.toUpperCase() === CardType[CardType.SPELL] && canBeDiscoveredByClass(c, currentClass),
			input.options,
		);
		return {
			cardType: CardType.SPELL,
			cardClasses: currentClass ? [CardClass[currentClass]] : undefined,
			possibleCards: possibleCards,
		};
	},
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const currentClass = input.inputOptions.deckState.getCurrentClass();
		return filterCards(
			Marshspawn.cardIds[0],
			input.allCards,
			(c) => c.type?.toUpperCase() === CardType[CardType.SPELL] && canBeDiscoveredByClass(c, currentClass),
			input.inputOptions,
		);
	},
};
