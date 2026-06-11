/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds } from '@firestone-hs/reference-data';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

export const AnnoyOHorn: StaticGeneratingCard = {
	cardIds: [CardIds.AnnoyOHorn_DALA_722, CardIds.AnnoyOHorn_ONY_005tc3],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => [
		CardIds.AnnoyingFan,
		CardIds.AnnoyOTronCore,
		CardIds.AnnoyOModule_BOT_911,
		CardIds.PsychOTron,
		CardIds.AnnoyOTroupe_ETC_321,
	],
};
