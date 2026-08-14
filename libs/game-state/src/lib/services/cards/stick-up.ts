/* eslint-disable no-mixed-spaces-and-tabs */
// Stick Up (WW_411): 1 Mana
// "[x]<b>Discover</b> a <b>Quickdraw</b> card from another class."

import { CardIds, GameTag, hasMechanic, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { fromAnotherClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasMechanic(c, GameTag.QUICKDRAW) && fromAnotherClass(c, currentClass);

export const StickUp: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.StickUp_WW_411],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			StickUp.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			StickUp.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { mechanics: [GameTag.QUICKDRAW], possibleCards };
	},
};
