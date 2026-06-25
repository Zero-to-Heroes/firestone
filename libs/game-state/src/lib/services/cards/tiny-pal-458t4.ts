/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Tiny Pal (JAIL_458t4)
 * After your hero attacks, get a random Battlecry minion. It costs (2) less. Choose another ammunition.
 */
import { CardIds, CardType, GameTag, hasMechanic } from '@firestone-hs/reference-data';

import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const battlecryMinionFilter = (c: Parameters<typeof hasCorrectType>[0]) =>
	hasCorrectType(c, CardType.MINION) && hasMechanic(c, GameTag.BATTLECRY);

export const TinyPal458t4: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.TinyPal_JAIL_458t4],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			CardIds.TinyPal_JAIL_458t4,
			input.allCards,
			battlecryMinionFilter,
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => ({
		cardType: CardType.MINION,
		mechanics: [GameTag.BATTLECRY],
		possibleCards: filterCards(
			CardIds.TinyPal_JAIL_458t4,
			input.allCards,
			battlecryMinionFilter,
			input.options,
		),
	}),
};
