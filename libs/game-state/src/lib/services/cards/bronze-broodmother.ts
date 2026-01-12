/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds } from '@firestone-hs/reference-data';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

// Bronze Broodmother (TOT_330)
// "When you draw this, summon a 1/1 Wee Whelp."
// Summons a fixed token: Wee Whelp (CardIds.WeeWhelpToken)
export const BronzeBroodmother: StaticGeneratingCard = {
	cardIds: [CardIds.BronzeBroodmother],
	publicCreator: false,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		// Returns the Wee Whelp token (1/1 Dragon)
		return [CardIds.WeeWhelpToken];
	},
};
