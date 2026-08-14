/* eslint-disable no-mixed-spaces-and-tabs */
// Gift of Fire (EDR_872A): 1 Mana
// "<b>Discover</b> a Mage spell."

import { CardIds, CardType, CardClass, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, canBeDiscoveredByClass, hasCorrectClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.SPELL) && hasCorrectClass(c, CardClass.MAGE) && canBeDiscoveredByClass(c, currentClass);

export const GiftOfFire: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.GiftOfFire_EDR_872A],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			GiftOfFire.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			GiftOfFire.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { cardType: CardType.SPELL, cardClasses: [CardClass.MAGE], possibleCards };
	},
};
