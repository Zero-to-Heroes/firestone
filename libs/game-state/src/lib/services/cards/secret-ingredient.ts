/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Secret Ingredient (JAIL_201)
 * Choose One - Give your hero +2 Attack this turn; or get a random Druid card.
 */
import { CardClass, CardIds } from '@firestone-hs/reference-data';

import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const druidCardFilter = (c: Parameters<typeof hasCorrectClass>[0]) => hasCorrectClass(c, CardClass.DRUID);

export const SecretIngredient: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.SecretIngredient_JAIL_201],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(CardIds.SecretIngredient_JAIL_201, input.allCards, druidCardFilter, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => ({
		cardClasses: [CardClass.DRUID],
		possibleCards: filterCards(CardIds.SecretIngredient_JAIL_201, input.allCards, druidCardFilter, input.options),
	}),
};
