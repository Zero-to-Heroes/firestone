/* eslint-disable no-mixed-spaces-and-tabs */
// Shadowflame Suffusion (FIR_939): 2 Mana
// "[x]Deal $2 damage. <b>Discover</b> a Warrior minion with a <b>Dark Gift</b>."

import { CardIds, CardType, CardClass, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCorrectClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCorrectClass(c, CardClass.WARRIOR);

export const ShadowflameSuffusion: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.ShadowflameSuffusion_FIR_939],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(ShadowflameSuffusion.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(ShadowflameSuffusion.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.MINION, cardClasses: [CardClass.WARRIOR], possibleCards };
	},
};
