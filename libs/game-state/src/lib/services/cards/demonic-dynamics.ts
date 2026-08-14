/* eslint-disable no-mixed-spaces-and-tabs */
// Demonic Dynamics (ETC_083): 2 Mana
// "[x]<b>Discover</b> 2 Demons. <b>Finale:</b> Give them +1/+2."

import { CardIds, CardType, Race, hasCorrectTribe, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.DEMON) && canBeDiscoveredByClass(c, currentClass);

export const DemonicDynamics: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.DemonicDynamics],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			DemonicDynamics.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			DemonicDynamics.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { cardType: CardType.MINION, races: [Race.DEMON], possibleCards };
	},
};
