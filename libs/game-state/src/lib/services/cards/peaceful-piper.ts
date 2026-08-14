/* eslint-disable no-mixed-spaces-and-tabs */
// Peaceful Piper (ETC_375 / ETC_375b): 1 Mana 1/1
// "<b>Choose One -</b> Draw a Beast; or <b>Discover</b> one."

import { CardIds, CardType, Race, hasCorrectTribe, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.BEAST) && canBeDiscoveredByClass(c, currentClass);

export const PeacefulPiper: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.PeacefulPiper, CardIds.PeacefulPiper_HappyHippie],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			PeacefulPiper.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			PeacefulPiper.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { cardType: CardType.MINION, races: [Race.BEAST], possibleCards };
	},
};
