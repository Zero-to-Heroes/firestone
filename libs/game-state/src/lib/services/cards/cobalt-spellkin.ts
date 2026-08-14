/* eslint-disable no-mixed-spaces-and-tabs */
// Cobalt Spellkin (DRG_075): 5 Mana 3/5 DRAGON
// "<b>Battlecry:</b> Add two 1-Cost spells from your class to your hand."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.SPELL) &&
	hasCost(c, '==', 1) &&
	!!currentClass &&
	c.classes?.includes(currentClass.toUpperCase());

export const CobaltSpellkin: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.CobaltSpellkin_DRG_075],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			CobaltSpellkin.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			CobaltSpellkin.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { cardType: CardType.SPELL, cost: 1, possibleCards };
	},
};
