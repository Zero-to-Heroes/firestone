import { Injectable } from '@angular/core';
import { DuelsRewardsInfo } from '@firestone-hs/retrieve-users-duels-runs/dist/duels-rewards-info';
import { DuelsRunInfo } from '@firestone-hs/retrieve-users-duels-runs/dist/duels-run-info';
import { Input } from '@firestone-hs/retrieve-users-duels-runs/dist/input';
import {
	DuelsRewardsInfo as InputDuelsRewardsInfo,
	Input as LootInput,
} from '@firestone-hs/save-dungeon-loot-info/dist/input';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { ApiRunner } from '@firestone/shared/framework/core';
import { UserService } from '../user.service';

const DUELS_RUN_INFO_URL = 'https://cc3tc224po5orwembimzyaxqhy0khyij.lambda-url.us-west-2.on.aws/';

@Injectable()
export class DuelsUserRunsService {
	public duelsRuns$$ = new SubscriberAwareBehaviorSubject<readonly DuelsRunInfo[]>(null);
	public duelsRewards$$ = new SubscriberAwareBehaviorSubject<readonly DuelsRewardsInfo[]>(null);

	private remoteRunsData$$ = new SubscriberAwareBehaviorSubject<any>([]);

	constructor(private readonly api: ApiRunner, private readonly userService: UserService) {
		this.init();
	}

	public async newLoot(dungeonLootInfo: LootInput) {
		// There was a race condition
		const userDuelsRunInfos = await this.duelsRuns$$.getValueWithInit();
		if (userDuelsRunInfos == null) {
			console.error('[duels-loot] no duels run info');
			return [null, null];
		}

		const infosForCurrentRun = userDuelsRunInfos?.filter((info) => info.runId === dungeonLootInfo.runId) ?? [];
		const newInfos: readonly DuelsRunInfo[] = buildNewInfos(dungeonLootInfo, infosForCurrentRun);
		console.debug('[duels-runs] newInfos', newInfos);
		console.log('[duels-runs] existing loot length', userDuelsRunInfos?.length);
		const duelsRunInfos: readonly DuelsRunInfo[] = [...userDuelsRunInfos, ...newInfos];
		console.log('[duels-runs] new loot length', duelsRunInfos.length);
		this.duelsRuns$$.next(duelsRunInfos);

		const userDuelsRewards = await this.duelsRewards$$.getValueWithInit();
		const rewards: readonly DuelsRewardsInfo[] = [
			...(userDuelsRewards ?? []),
			...buildRewards(dungeonLootInfo.rewards),
		];
		this.duelsRewards$$.next(rewards);
	}

	private async init() {
		this.duelsRuns$$.onFirstSubscribe(() => {
			this.remoteRunsData$$.subscribe();
		});
		this.duelsRewards$$.onFirstSubscribe(() => {
			this.remoteRunsData$$.subscribe();
		});
		this.remoteRunsData$$.onFirstSubscribe(async () => {
			const user = await this.userService.getCurrentUser();
			const input: Input = {
				userId: user.userId,
				userName: user.username,
			};
			const results: any = await this.api.callPostApi(DUELS_RUN_INFO_URL, input);
			const stepResults: readonly DuelsRunInfo[] =
				results?.results.map(
					(info) =>
						({
							...info,
							option1Contents: info.option1Contents?.split(','),
							option2Contents: info.option2Contents?.split(','),
							option3Contents: info.option3Contents?.split(','),
						} as DuelsRunInfo),
				) || [];
			const rewardsResults: readonly DuelsRewardsInfo[] = results?.rewardsResults || [];
			console.log('[duels-runs] loaded user runs and rewards', stepResults?.length, rewardsResults?.length);
			console.debug('[duels-runs] loaded user runs and rewards', results);
			this.duelsRuns$$.next(stepResults);
			this.duelsRewards$$.next(rewardsResults);
		});
	}
}

const buildRewards = (rewards: InputDuelsRewardsInfo): readonly DuelsRewardsInfo[] => {
	if (!rewards?.Rewards) {
		return [];
	}

	return rewards.Rewards.map(
		(reward) =>
			({
				rewardAmount: reward.Amount,
				rewardBoosterId: reward.BoosterId,
				rewardType: reward.Type,
			} as DuelsRewardsInfo),
	);
};

const buildNewInfos = (dungeonLootInfo: LootInput, existingInfos: readonly DuelsRunInfo[]): readonly DuelsRunInfo[] => {
	return [
		buildHeroPowerInfo(dungeonLootInfo, existingInfos),
		buildSignatureTreasureInfo(dungeonLootInfo, existingInfos),
		buildLootInfo(dungeonLootInfo),
		buildTreasureInfo(dungeonLootInfo),
	].filter((info) => info);
};

const buildTreasureInfo = (dungeonLootInfo: LootInput): DuelsRunInfo => {
	if (!dungeonLootInfo.treasureOptions || dungeonLootInfo.treasureOptions.length === 0) {
		return null;
	}
	return {
		...buildCommonInfo(dungeonLootInfo),
		bundleType: 'treasure',
		option1: dungeonLootInfo.treasureOptions[0],
		option2: dungeonLootInfo.treasureOptions.length < 2 ? null : dungeonLootInfo.treasureOptions[1],
		option3: dungeonLootInfo.treasureOptions.length < 3 ? null : dungeonLootInfo.treasureOptions[2],
		chosenOptionIndex: dungeonLootInfo.chosenTreasureIndex,
	};
};

const buildLootInfo = (dungeonLootInfo: LootInput): DuelsRunInfo => {
	if (!dungeonLootInfo.lootBundles || dungeonLootInfo.lootBundles.length === 0) {
		return null;
	}
	return {
		...buildCommonInfo(dungeonLootInfo),
		bundleType: 'loot',
		option1: dungeonLootInfo.lootBundles[0].bundleId,
		option1Contents: dungeonLootInfo.lootBundles[0].elements,
		option2: dungeonLootInfo.lootBundles.length < 2 ? null : dungeonLootInfo.lootBundles[1].bundleId,
		option2Contents: dungeonLootInfo.lootBundles.length < 2 ? null : dungeonLootInfo.lootBundles[1].elements,
		option3: dungeonLootInfo.lootBundles.length < 3 ? null : dungeonLootInfo.lootBundles[2].bundleId,
		option3Contents: dungeonLootInfo.lootBundles.length < 3 ? null : dungeonLootInfo.lootBundles[2].elements,
		chosenOptionIndex: dungeonLootInfo.chosenLootIndex,
	};
};

const buildHeroPowerInfo = (dungeonLootInfo: LootInput, existingInfos: readonly DuelsRunInfo[]): DuelsRunInfo => {
	if (!dungeonLootInfo.startingHeroPower || existingInfos.find((info) => info.bundleType === 'hero-power')) {
		return null;
	}
	return {
		...buildCommonInfo(dungeonLootInfo),
		bundleType: 'hero-power',
		option1: dungeonLootInfo.startingHeroPower,
		chosenOptionIndex: 1,
	};
};

const buildSignatureTreasureInfo = (
	dungeonLootInfo: LootInput,
	existingInfos: readonly DuelsRunInfo[],
): DuelsRunInfo => {
	if (!dungeonLootInfo.signatureTreasure || existingInfos.find((info) => info.bundleType === 'signature-treasure')) {
		return null;
	}
	return {
		...buildCommonInfo(dungeonLootInfo),
		bundleType: 'signature-treasure',
		option1: dungeonLootInfo.signatureTreasure,
		chosenOptionIndex: 1,
	};
};

const buildCommonInfo = (dungeonLootInfo: LootInput): DuelsRunInfo => {
	return {
		adventureType: dungeonLootInfo.type,
		creationTimestamp: Date.now(),
		reviewId: dungeonLootInfo.reviewId,
		runId: dungeonLootInfo.runId,
		wins: dungeonLootInfo.currentWins,
		losses: dungeonLootInfo.currentLosses,
		rating: dungeonLootInfo.rating,
	} as DuelsRunInfo;
};
