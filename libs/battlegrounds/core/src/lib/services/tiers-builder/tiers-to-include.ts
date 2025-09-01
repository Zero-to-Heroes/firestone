import { CardIds } from '@firestone-hs/reference-data';
import { QuestReward } from '@firestone/game-state';

export const buildTiersToInclude = (
	showTierSeven: boolean,
	anomalies: readonly string[],
	heroPowerCardId: string,
	playerTrinkets: readonly string[],
	questRewards: readonly QuestReward[],
): readonly number[] => {
	let tiersToInclude = [1, 2, 3, 4, 5, 6];
	if (
		showTierSeven ||
		anomalies.includes(CardIds.SecretsOfNorgannon_BG27_Anomaly_504) ||
		heroPowerCardId === CardIds.ThorimStormlord_ChooseYourChampion_BG27_HERO_801p2 ||
		playerTrinkets?.includes(CardIds.PaglesFishingRod_BG30_MagicItem_993) ||
		questRewards?.some((reward) => reward.cardId === CardIds.NorgannonsReward_BG33_Reward_010)
	) {
		tiersToInclude.push(7);
	}
	if (anomalies.includes(CardIds.BigLeague_BG27_Anomaly_100)) {
		tiersToInclude = [3, 4, 5, 6];
	}
	if (anomalies.includes(CardIds.LittleLeague_BG27_Anomaly_800)) {
		tiersToInclude = [1, 2, 3, 4];
	}
	if (anomalies.includes(CardIds.WhatAreTheOddsquestion_BG27_Anomaly_101)) {
		tiersToInclude = [1, 3, 5];
	}
	if (anomalies.includes(CardIds.HowToEvenquestionquestion_BG27_Anomaly_102)) {
		tiersToInclude = [2, 4, 6];
	}
	if (anomalies.includes(CardIds.ValuationInflation_BG27_Anomaly_556)) {
		tiersToInclude = tiersToInclude.filter((tier) => tier !== 1);
	}
	return tiersToInclude;
};
