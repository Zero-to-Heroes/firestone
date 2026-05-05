/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, GameTag, ReferenceCard } from '@firestone-hs/reference-data';
import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const CrystallizedLeyline: StaticGeneratingCard = {
	cardIds: [CardIds.CrystallizedLeyline_MEND_502],
	publicCreator: true,
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const card = input.inputOptions.deckState.findCard(input.entityId)?.card;
		const cost = card?.tags?.[GameTag.TAG_SCRIPT_DATA_NUM_1] ?? 6;
		return filterCards(
			CardIds.CrystallizedLeyline_MEND_502,
			input.allCards,
			(c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', cost),
			input.inputOptions,
		);
	},
};
