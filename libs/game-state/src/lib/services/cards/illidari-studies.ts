/* eslint-disable no-mixed-spaces-and-tabs */
// Illidari Studies (CORE_YOP_001 / YOP_001): 1 Mana
// "<b>Discover</b> an <b>Outcast</b> card. Your next one costs (1) less."

import { CardIds, GameTag, hasMechanic, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasMechanic(c, GameTag.OUTCAST) && canBeDiscoveredByClass(c, currentClass);

export const IllidariStudies: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.IllidariStudiesCore, CardIds.IllidariStudies_YOP_001],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			IllidariStudies.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			IllidariStudies.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { mechanics: [GameTag.OUTCAST], possibleCards };
	},
};
