import { Injectable } from '@angular/core';
import { sortByProperties } from '@firestone/shared/framework/common';
import { AchievementHistory } from '../../../../models/achievement/achievement-history';
import { AchievementHistoryStorageService } from '../../../achievement/achievement-history-storage.service';
import { RawAchievementsLoaderService } from '../../../achievement/data/raw-achievements-loader.service';

@Injectable()
export class AchievementUpdateHelper {
	constructor(
		private readonly achievementHistoryStorage: AchievementHistoryStorageService,
		private readonly achievementsLoader: RawAchievementsLoaderService,
	) {}

	public async buildAchievementHistory(): Promise<readonly AchievementHistory[]> {
		const [history, achievements] = await Promise.all([
			this.achievementHistoryStorage.loadAll(),
			// TODO: use the state manager instead. Since the request will be cached by the browser it's not really an issue,
			// but it should still be done in a cleaner way
			this.achievementsLoader.loadRawAchievements(),
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
					return {
						...history,
						displayName: achievements.find((ach) => ach.id === history.achievementId).displayName,
					} as AchievementHistory;
				})
				.filter((history) => history)
				// We want to have the most recent at the top
				.sort(sortByProperties((a) => [-a.creationTimestamp]))
		);
	}
}
