/* eslint-disable no-mixed-spaces-and-tabs */
// Solarian Prime (BT_028t): 7 Mana 7/7 DEMON
// "<b>Spell Damage +1</b> <b>Battlecry:</b> Cast 5 random Mage spells <i>(targets enemies if possible)</i>."

import { CardIds, CardType, CardClass, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCorrectClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.SPELL) && hasCorrectClass(c, CardClass.MAGE);

export const SolarianPrime: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.AstromancerSolarian_SolarianPrimeToken],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(SolarianPrime.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(SolarianPrime.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.SPELL, cardClasses: [CardClass.MAGE], possibleCards };
	},
};
