/* eslint-disable no-mixed-spaces-and-tabs */
// Training Session (NX2_029): 1 Mana
// "<b>Discover</b> a <b>Taunt</b> minion. If you play it this turn, repeat this."

import { CardIds, CardType, GameTag, hasMechanic, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.MINION) && hasMechanic(c, GameTag.TAUNT) && canBeDiscoveredByClass(c, currentClass);

export const TrainingSession: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.TrainingSession_NX2_029],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			TrainingSession.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			TrainingSession.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { cardType: CardType.MINION, mechanics: [GameTag.TAUNT], possibleCards };
	},
};
