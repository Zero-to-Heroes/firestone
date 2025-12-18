/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { hasCorrectType } from '../../..';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const AmuletOfCritters: StaticGeneratingCard = {
	cardIds: [CardIds.AmuletOfCritters_AmuletOfCrittersToken_VAC_959t06t],
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const possibleCards = filterCards(
			AmuletOfCritters.cardIds[0],
			input.allCards,
			(c) => c.cost === 4 && hasCorrectType(c, CardType.MINION),
			input.inputOptions,
		);
		return possibleCards;
	},
};
