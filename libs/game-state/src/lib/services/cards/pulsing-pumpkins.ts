/* eslint-disable no-mixed-spaces-and-tabs */
// Pulsing Pumpkins (TOY_829hp): 2 Mana
// "[x]Deal $3 damage, with crushing <i>brawn!</i> <b>Discover</b> an Undead, to serve as your <i>pawn!</i>"

import { CardIds, Race, hasCorrectTribe, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectTribe(c, Race.UNDEAD) && canBeDiscoveredByClass(c, currentClass);

export const PulsingPumpkins: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.PulsingPumpkins_TOY_829hp],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			PulsingPumpkins.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			PulsingPumpkins.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { races: [Race.UNDEAD], possibleCards };
	},
};
