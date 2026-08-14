/* eslint-disable no-mixed-spaces-and-tabs */
// Daydreaming Pixie (EDR_530): 2 Mana 0/4
// "At the end of your turn, get a random Nature spell."

import { CardIds, CardType, SpellSchool, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCorrectSpellSchool } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.SPELL) && hasCorrectSpellSchool(c, SpellSchool.NATURE);

export const DaydreamingPixie: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.DaydreamingPixie_EDR_530],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(DaydreamingPixie.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(DaydreamingPixie.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.SPELL, spellSchools: [SpellSchool.NATURE], possibleCards };
	},
};
