import { DuelsRewardsInfo } from '@firestone-hs/retrieve-users-duels-runs/dist/duels-rewards-info';
import { DuelsRunInfo } from '@firestone-hs/retrieve-users-duels-runs/dist/duels-run-info';
import { DuelsRewardsInfo as InputDuelsRewardsInfo, Input } from '@firestone-hs/save-dungeon-loot-info/dist/input';
import { DuelsState } from '../../../../../models/duels/duels-state';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { DungeonLootInfoUpdatedEvent } from '../../events/duels/dungeon-loot-info-updated-event';
import { Processor } from '../processor';

export class DungeonLootInfoUpdatedProcessor implements Processor {
	public async process(
		event: DungeonLootInfoUpdatedEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const dungeonLootInfo = event.dungeonLootInfo;
		const newInfos: readonly DuelsRunInfo[] = this.buildNewInfos(dungeonLootInfo, currentState.duels.duelsRunInfos);
		const rewards: readonly DuelsRewardsInfo[] = [
			...(currentState.duels.duelsRewardsInfo ?? []),
			...this.buildRewards(dungeonLootInfo.rewards),
		];

		const duelsRunInfos: readonly DuelsRunInfo[] = [...currentState.duels.duelsRunInfos, ...newInfos];
		const newDuels = currentState.duels.update({
			duelsRunInfos: duelsRunInfos,
			duelsRewardsInfo: rewards,
		} as DuelsState);
		return [
			currentState.update({
				duels: newDuels,
			} as MainWindowState),
			null,
		];
	}

	private buildRewards(rewards: InputDuelsRewardsInfo): readonly DuelsRewardsInfo[] {
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
	}

	private buildNewInfos(dungeonLootInfo: Input, existingInfos: readonly DuelsRunInfo[]): readonly DuelsRunInfo[] {
		return [
			this.buildHeroPowerInfo(dungeonLootInfo, existingInfos),
			this.buildSignatureTreasureInfo(dungeonLootInfo, existingInfos),
			this.buildLootInfo(dungeonLootInfo),
			this.buildTreasureInfo(dungeonLootInfo),
		].filter((info) => info);
	}

	private buildTreasureInfo(dungeonLootInfo: Input): DuelsRunInfo {
		if (!dungeonLootInfo.treasureOptions || dungeonLootInfo.treasureOptions.length === 0) {
			return null;
		}
		return {
			...this.buildCommonInfo(dungeonLootInfo),
			bundleType: 'loot',
			option1: dungeonLootInfo.treasureOptions[0],
			option2: dungeonLootInfo.treasureOptions.length < 2 ? null : dungeonLootInfo.treasureOptions[1],
			option3: dungeonLootInfo.treasureOptions.length < 3 ? null : dungeonLootInfo.treasureOptions[2],
			chosenOptionIndex: dungeonLootInfo.chosenTreasureIndex,
		};
	}

	private buildLootInfo(dungeonLootInfo: Input): DuelsRunInfo {
		if (!dungeonLootInfo.lootBundles || dungeonLootInfo.lootBundles.length === 0) {
			return null;
		}
		return {
			...this.buildCommonInfo(dungeonLootInfo),
			bundleType: 'loot',
			option1: dungeonLootInfo.lootBundles[0].bundleId,
			option1Contents: dungeonLootInfo.lootBundles[0].elements,
			option2: dungeonLootInfo.lootBundles.length < 2 ? null : dungeonLootInfo.lootBundles[1].bundleId,
			option2Contents: dungeonLootInfo.lootBundles.length < 2 ? null : dungeonLootInfo.lootBundles[1].elements,
			option3: dungeonLootInfo.lootBundles.length < 3 ? null : dungeonLootInfo.lootBundles[2].bundleId,
			option3Contents: dungeonLootInfo.lootBundles.length < 3 ? null : dungeonLootInfo.lootBundles[2].elements,
			chosenOptionIndex: dungeonLootInfo.chosenLootIndex,
		};
	}

	private buildHeroPowerInfo(dungeonLootInfo: Input, existingInfos: readonly DuelsRunInfo[]): DuelsRunInfo {
		if (!dungeonLootInfo.startingHeroPower || existingInfos.find((info) => info.bundleType === 'hero-power')) {
			return null;
		}
		return {
			...this.buildCommonInfo(dungeonLootInfo),
			bundleType: 'hero-power',
			option1: dungeonLootInfo.startingHeroPower,
			chosenOptionIndex: 1,
		};
	}

	private buildSignatureTreasureInfo(dungeonLootInfo: Input, existingInfos: readonly DuelsRunInfo[]): DuelsRunInfo {
		if (
			!dungeonLootInfo.signatureTreasure ||
			existingInfos.find((info) => info.bundleType === 'signature-treasure')
		) {
			return null;
		}
		return {
			...this.buildCommonInfo(dungeonLootInfo),
			bundleType: 'signature-treasure',
			option1: dungeonLootInfo.signatureTreasure,
			chosenOptionIndex: 1,
		};
	}

	private buildCommonInfo(dungeonLootInfo: Input): DuelsRunInfo {
		return {
			adventureType: dungeonLootInfo.type,
			creationTimestamp: Date.now(),
			reviewId: dungeonLootInfo.reviewId,
			runId: dungeonLootInfo.runId,
			wins: dungeonLootInfo.currentWins,
			losses: dungeonLootInfo.currentLosses,
			rating: dungeonLootInfo.rating,
		} as DuelsRunInfo;
	}
}
