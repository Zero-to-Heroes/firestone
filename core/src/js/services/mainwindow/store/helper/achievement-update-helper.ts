import { Injectable } from '@angular/core';
import { AchievementHistory } from '../../../../models/achievement/achievement-history';
import { AchievementHistoryStorageService } from '../../../achievement/achievement-history-storage.service';
import { AchievementsLoaderService } from '../../../achievement/data/achievements-loader.service';

@Injectable()
export class AchievementUpdateHelper {
	constructor(
		private readonly achievementHistoryStorage: AchievementHistoryStorageService,
		private readonly achievementsLoader: AchievementsLoaderService,
	) {}

	public async buildAchievementHistory(): Promise<readonly AchievementHistory[]> {
		const [history, achievements] = await Promise.all([
			this.achievementHistoryStorage.loadAll(),
			this.achievementsLoader.getAchievements(),
		]);

		return (
			history
				.filter((history) => history.numberOfCompletions === 1)
				.map((history) => {
					const matchingAchievement = achievements.find((ach) => ach.id === history.achievementId);
					// This can happen with older history items
					if (!matchingAchievement) {
						return null;
					}
					return Object.assign(new AchievementHistory(), history, {
						displayName: achievements.find((ach) => ach.id === history.achievementId).displayName,
					} as AchievementHistory);
				})
				.filter((history) => history)
				// We want to have the most recent at the top
				.reverse()
		);
	}
}
