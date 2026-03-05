/* eslint-disable no-mixed-spaces-and-tabs */
// Shadowed Informant (CATA_614): 2 Mana 2/2 Dragon Neutral
// "Battlecry: Discover a spell from your class. (Swaps class each turn!)"

import { CardIds, CardType, GameTag } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass, hasCorrectClass, hasCorrectType } from '../../related-cards/dynamic-pools';
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
		const creatorEntityId = input.card?.creatorEntityId;
		const creator = input.deckState.findCard(creatorEntityId)?.card;
		const classTag: number | undefined = creator?.tags?.[GameTag.TAG_SCRIPT_DATA_NUM_1];
		console.debug('[shadowed-informant] class tag', { classTag }, input, creator);
		const possibleCards = filterCards(
			ShadowedInformant.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.SPELL) && (classTag ? hasCorrectClass(c, classTag) : true),
			input.options,
		);
		return {
			cardType: CardType.SPELL,
			possibleCards: possibleCards,
		};
	},
};
