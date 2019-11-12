import { Achievement } from '../../../../../models/achievement';
import { AchievementSet } from '../../../../../models/achievement-set';
import { CompletedAchievement } from '../../../../../models/completed-achievement';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { ReplayInfo } from '../../../../../models/replay-info';
import { VisualAchievement } from '../../../../../models/visual-achievement';
import { VisualAchievementCategory } from '../../../../../models/visual-achievement-category';
import { AchievementsLocalStorageService } from '../../../../achievement/achievements-local-storage.service';
import { AchievementsLoaderService } from '../../../../achievement/data/achievements-loader.service';
import { Events } from '../../../../events.service';
import { AchievementRecordedEvent } from '../../events/achievements/achievement-recorded-event';
import { AchievementStateHelper } from '../../helper/achievement-state-helper';
import { Processor } from '../processor';

export class AchievementRecordedProcessor implements Processor {
	constructor(
		private achievementStorage: AchievementsLocalStorageService,
		private achievementStateHelper: AchievementStateHelper,
		private achievementLoader: AchievementsLoaderService,
		private events: Events,
	) {}

	public async process(event: AchievementRecordedEvent, currentState: MainWindowState): Promise<MainWindowState> {
		const achievementId: string = event.achievementId;
		const replayInfo: ReplayInfo = event.replayInfo;
		await this.saveReplayInfo(achievementId, replayInfo);
		const newGlobalCategories = this.updateGlobalCategories(
			currentState.achievements.globalCategories,
			achievementId,
			replayInfo,
		);
		const newState = this.achievementStateHelper.updateStateFromNewGlobalCategories(
			currentState.achievements,
			newGlobalCategories,
		);
		const achievement: Achievement = await this.achievementLoader.getAchievement(achievementId);
		// We need to do this in case the pre-record notif has already expired
		// console.log('found full achievement to broadcast', achievement, updatedAchievement);
		// TODO: Raising events here feels weird, and it's probably a design flaw.
		this.events.broadcast(Events.ACHIEVEMENT_RECORDED, achievement);
		return Object.assign(new MainWindowState(), currentState, {
			achievements: newState,
		});
	}

	private updateGlobalCategories(
		globalCategories: readonly VisualAchievementCategory[],
		achievementId: string,
		replayInfo: ReplayInfo,
	): readonly VisualAchievementCategory[] {
		const globalCategory = globalCategories.find(cat =>
			cat.achievementSets.some(set =>
				set.achievements.some(achievement =>
					achievement.completionSteps.some(step => step.id === achievementId),
				),
			),
		);
		const achievementSet = globalCategory.achievementSets.find(set =>
			set.achievements.some(achievement => achievement.completionSteps.some(step => step.id === achievementId)),
		);
		const updatedSet = this.updateReplayInfo(achievementSet, achievementId, replayInfo);
		const updatedGlobalCategory = this.updateCategory(globalCategory, updatedSet);

		const newCategories = globalCategories.map(cat =>
			cat.id === updatedGlobalCategory.id ? updatedGlobalCategory : cat,
		);
		return newCategories as readonly VisualAchievementCategory[];
	}

	private updateCategory(
		globalCategory: VisualAchievementCategory,
		newSet: AchievementSet,
	): VisualAchievementCategory {
		const newAchievements = globalCategory.achievementSets.map(set => (set.id === newSet.id ? newSet : set));
		return Object.assign({} as VisualAchievementCategory, globalCategory, {
			achievementSets: newAchievements as readonly AchievementSet[],
		} as VisualAchievementCategory);
	}

	private updateReplayInfo(
		achievementSet: AchievementSet,
		achievementId: string,
		replayInfo: ReplayInfo,
	): AchievementSet {
		const existingAchievement = achievementSet.achievements.find(achv =>
			achv.completionSteps.some(step => step.id === achievementId),
		);
		const updatedReplayInfo = [replayInfo, ...existingAchievement.replayInfo] as readonly ReplayInfo[];
		const updatedAchievement = Object.assign(new VisualAchievement(), existingAchievement, {
			replayInfo: updatedReplayInfo,
		} as VisualAchievement);

		const existingIndex = achievementSet.achievements.indexOf(existingAchievement);
		const updatedAchievements = achievementSet.achievements.map((item, index) =>
			index === existingIndex ? updatedAchievement : item,
		);
		return Object.assign(new AchievementSet(), achievementSet, {
			achievements: updatedAchievements as readonly VisualAchievement[],
		} as AchievementSet);
	}

	private async saveReplayInfo(achievementId: string, replayInfo: ReplayInfo) {
		const achievement: CompletedAchievement = await this.achievementStorage.loadAchievementFromCache(achievementId);
		const newAchievement = new CompletedAchievement(achievement.id, achievement.numberOfCompletions, [
			replayInfo,
			...(achievement.replayInfo || []),
		]);
		return await this.achievementStorage.cacheAchievement(newAchievement);
	}
}
