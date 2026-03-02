/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

// Sands of Time (TIME_EVENT_999)
// "<b>Rewind</b> <b>Discover</b> a spell from ANY class. <i>(Or just your class after you <b>Rewind</b>!)</i>"
export const SandsOfTime: StaticGeneratingCard = {
	cardIds: [CardIds.SandsOfTime_TIME_EVENT_999],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			SandsOfTime.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.SPELL),
			input.inputOptions,
		);
	},
};
