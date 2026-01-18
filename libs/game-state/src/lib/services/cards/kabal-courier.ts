/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Kabal Courier
 * 2-cost 2/2 Minion
 * Battlecry: Discover a Mage, Priest, or Warlock card.
 */
import { CardClass, CardIds } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const KABAL_CLASSES = [CardClass.MAGE, CardClass.PRIEST, CardClass.WARLOCK];

const isKabalCard = (classes: string[] | undefined): boolean => {
	if (!classes) {
		return false;
	}
	return KABAL_CLASSES.some((cls) => classes.includes(CardClass[cls]));
};

export const KabalCourier: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.KabalCourier, CardIds.KabalCourier_WON_130],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			KabalCourier.cardIds[0],
			input.allCards,
			(c) => isKabalCard(c.classes) && canBeDiscoveredByClass(c, input.inputOptions.currentClass),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			KabalCourier.cardIds[0],
			input.allCards,
			(c) => isKabalCard(c.classes) && canBeDiscoveredByClass(c, input.deckState.getCurrentClass()),
			input.options,
		);
		return {
			cardClasses: KABAL_CLASSES,
			possibleCards: possibleCards,
		};
	},
};
