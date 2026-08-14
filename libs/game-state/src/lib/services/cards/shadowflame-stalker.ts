/* eslint-disable no-mixed-spaces-and-tabs */
// Shadowflame Stalker (FIR_924): 4 Mana 4/3 BEAST
// "<b>Battlecry:</b> <b>Discover</b> a Demon with a <b>Dark Gift</b>. Get a copy of it."

import { CardIds, CardType, Race, hasCorrectTribe, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.DEMON) && canBeDiscoveredByClass(c, currentClass);

export const ShadowflameStalker: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.ShadowflameStalker_FIR_924],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			ShadowflameStalker.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			ShadowflameStalker.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { cardType: CardType.MINION, races: [Race.DEMON], possibleCards };
	},
};
