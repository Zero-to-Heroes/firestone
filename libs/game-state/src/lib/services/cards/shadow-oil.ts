/* eslint-disable no-mixed-spaces-and-tabs */
// Shadow Oil (CFM_621t9 / CFM_621t23 / CFM_621t31)
// 1/5/10-Cost Neutral Kazakus Potion Spell
// "Add a random Demon to your hand." / "Add 2 random Demons to your hand." / "Add 3 random Demons to your hand."
import { CardIds, CardType, hasCorrectTribe, Race, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isDemonMinion = (card: ReferenceCard): boolean =>
	hasCorrectType(card, CardType.MINION) && hasCorrectTribe(card, Race.DEMON);

export const ShadowOil: GeneratingCard & StaticGeneratingCard = {
	cardIds: [
		CardIds.Kazakus_ShadowOilToken_CFM_621t9,
		CardIds.Kazakus_ShadowOilToken_CFM_621t23,
		CardIds.Kazakus_ShadowOilToken_CFM_621t31,
	],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(ShadowOil.cardIds[0], input.allCards, isDemonMinion, input.inputOptions);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.MINION,
			races: [Race.DEMON],
			possibleCards: filterCards(ShadowOil.cardIds[0], input.allCards, isDemonMinion, input.options),
		};
	},
};
