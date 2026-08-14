/* eslint-disable no-mixed-spaces-and-tabs */
// Supernova (GDB_301): 8 Mana
// "Fill your hand with random Fire spells. They cost (1)."

import { CardIds, CardType, SpellSchool, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) =>
	hasCorrectType(c, CardType.SPELL) && c?.spellSchool?.includes(SpellSchool[SpellSchool.FIRE]);

export const Supernova: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Supernova_GDB_301],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(Supernova.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(Supernova.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.SPELL, spellSchools: [SpellSchool.FIRE], possibleCards };
	},
};
