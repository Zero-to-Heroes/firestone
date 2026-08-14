/* eslint-disable no-mixed-spaces-and-tabs */
// Symbiosis (EDR_273): 1 Mana
// "[x]<b>Discover</b> a <b>Choose One</b> card from another class."

import { CardIds, GameTag, hasMechanic, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { fromAnotherClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasMechanic(c, GameTag.CHOOSE_ONE) && fromAnotherClass(c, currentClass);

export const Symbiosis: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Symbiosis_EDR_273],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			Symbiosis.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			Symbiosis.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { mechanics: [GameTag.CHOOSE_ONE], possibleCards };
	},
};
