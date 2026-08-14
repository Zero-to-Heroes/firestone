/* eslint-disable no-mixed-spaces-and-tabs */
// Spellcoiler (TSC_643): 2 Mana 2/3 NAGA
// "[x]<b>Battlecry:</b> If you've cast a spell while holding this, <b>Discover</b> a spell."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.SPELL) && canBeDiscoveredByClass(c, currentClass);

export const Spellcoiler: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Spellcoiler],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			Spellcoiler.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			Spellcoiler.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { cardType: CardType.SPELL, possibleCards };
	},
};
