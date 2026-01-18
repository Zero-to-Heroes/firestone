/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Grimestreet Informant
 * 2-cost 2/2 Minion
 * Battlecry: Discover a Hunter, Paladin, or Warrior card.
 */
import { CardClass, CardIds } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const GRIMESTREET_CLASSES = [CardClass.HUNTER, CardClass.PALADIN, CardClass.WARRIOR];

const isGrimestreetCard = (classes: string[] | undefined): boolean => {
	if (!classes) {
		return false;
	}
	return GRIMESTREET_CLASSES.some((cls) => classes.includes(CardClass[cls]));
};

export const GrimestreetInformant: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.GrimestreetInformant, CardIds.GrimestreetInformant_WON_331],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			GrimestreetInformant.cardIds[0],
			input.allCards,
			(c) => isGrimestreetCard(c.classes) && canBeDiscoveredByClass(c, input.inputOptions.currentClass),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			GrimestreetInformant.cardIds[0],
			input.allCards,
			(c) => isGrimestreetCard(c.classes) && canBeDiscoveredByClass(c, input.deckState.getCurrentClass()),
			input.options,
		);
		return {
			cardClasses: GRIMESTREET_CLASSES,
			possibleCards: possibleCards,
		};
	},
};
