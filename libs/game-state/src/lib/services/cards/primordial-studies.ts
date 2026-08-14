/* eslint-disable no-mixed-spaces-and-tabs */
// Primordial Studies (SCH_270): 1 Mana
// "<b>Discover</b> a <b>Spell Damage</b> minion. Your next one costs (1) less."

import { CardIds, CardType, GameTag, hasMechanic, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.MINION) &&
	hasMechanic(c, GameTag.SPELLPOWER) &&
	c?.id !== CardIds.Sif &&
	canBeDiscoveredByClass(c, currentClass);

export const PrimordialStudies: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.PrimordialStudies_SCH_270],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			PrimordialStudies.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			PrimordialStudies.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { cardType: CardType.MINION, mechanics: [GameTag.SPELLPOWER], possibleCards };
	},
};
