// Servant of Yogg-Saron
// Battlecry: Cast a random spell that costs (5) or MORE (targets chosen randomly).
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const ServantOfYoggSaron: StaticGeneratingCard = {
	cardIds: [CardIds.ServantOfYoggSaron, CardIds.ServantOfYoggSaron_WON_036],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			input.cardId,
			input.allCards,
			(c) => hasCorrectType(c, CardType.SPELL) && hasCost(c, '>=', 5),
			input.inputOptions,
		);
	},
};
