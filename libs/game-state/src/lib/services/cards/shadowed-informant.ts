/* eslint-disable no-mixed-spaces-and-tabs */
// Shadowed Informant (CATA_614): 2 Mana 2/2 Dragon Neutral
// "Battlecry: Discover a spell from your class. (Swaps class each turn!)"

import { CardClass, CardIds, CardType, GameTag } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const ShadowedInformant: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.ShadowedInformant_CATA_614],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			ShadowedInformant.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.SPELL) && canBeDiscoveredByClass(c, input.inputOptions.currentClass),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const classTag = input.options?.tags?.find((t) => t.Name === GameTag.TAG_SCRIPT_DATA_NUM_1);
		const classValue = classTag
			? CardClass[classTag.Value]
			: input.deckState.hero?.classes?.[0]
				? CardClass[input.deckState.hero?.classes?.[0]]
				: '';
		const possibleCards = filterCards(
			ShadowedInformant.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.SPELL) && canBeDiscoveredByClass(c, classValue),
			input.options,
		);
		return {
			cardType: CardType.SPELL,
			possibleCards: possibleCards,
		};
	},
};
