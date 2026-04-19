/* eslint-disable no-mixed-spaces-and-tabs */
// Shadowed Informant (CATA_614): 2 Mana 2/2 Dragon Neutral
// "Battlecry: Discover a spell from your class. (Swaps class each turn!)"

import { CardClass, CardIds, CardType, GameTag } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const ShadowedInformant: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.ShadowedInformant_CATA_614],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const card = input.inputOptions.deckState.findCard(input.entityId)?.card;
		const classTag: number | undefined =
			card?.tags?.[GameTag.TAG_SCRIPT_DATA_NUM_1] || input.inputOptions.deckState.getCurrentClassEnum();
		return filterCards(
			ShadowedInformant.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.SPELL) && (classTag ? hasCorrectClass(c, classTag) : true),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const creatorEntityId = input.card?.creatorEntityId;
		const creator = input.deckState.findCard(creatorEntityId)?.card;
		const classTag: number | undefined =
			creator?.tags?.[GameTag.TAG_SCRIPT_DATA_NUM_1] || input.deckState.getCurrentClassEnum();
		const possibleCards = filterCards(
			ShadowedInformant.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.SPELL) && (classTag ? hasCorrectClass(c, classTag) : true),
			input.options,
		);
		return {
			cardType: CardType.SPELL,
			cardClasses: [classTag as CardClass],
			possibleCards: possibleCards,
		};
	},
};
