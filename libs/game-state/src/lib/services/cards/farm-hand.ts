/* eslint-disable no-mixed-spaces-and-tabs */
// Farm Hand (WW_358): 3 Mana 4/3 UNDEAD
// "<b>Battlecry:</b> <b>Discover</b> an Undead. <b>Quickdraw:</b> It costs (2) less."

import { CardIds, Race, hasCorrectTribe, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectTribe(c, Race.UNDEAD) && canBeDiscoveredByClass(c, currentClass);

export const FarmHand: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.FarmHand_WW_358],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			FarmHand.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			FarmHand.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { races: [Race.UNDEAD], possibleCards };
	},
};
