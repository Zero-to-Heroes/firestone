import { EventEmitter, Injectable } from '@angular/core';
import { AchievementHistory } from '../../../models/achievement/achievement-history';
import { AchievementsState } from '../../../models/mainwindow/achievements-state';
import { AchievementHistoryStorageService } from '../../achievement/achievement-history-storage.service';
import { AchievementsLoaderService } from '../../achievement/data/achievements-loader.service';
import { Events } from '../../events.service';
import { OverwolfService } from '../../overwolf.service';
import { AchievementsInitEvent } from './events/achievements/achievements-init-event';
import { MainWindowStoreEvent } from './events/main-window-store-event';
import { AchievementUpdateHelper } from './helper/achievement-update-helper';

@Injectable()
export class AchievementsBootstrapService {
	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly events: Events,
		private readonly achievementsHelper: AchievementUpdateHelper,
		private readonly achievementHistoryStorage: AchievementHistoryStorageService,
		private readonly achievementsLoader: AchievementsLoaderService,
		private readonly ow: OverwolfService,
	) {
		this.events.on(Events.START_POPULATE_ACHIEVEMENT_STATE).subscribe(event => this.initAchievementState());
		setTimeout(() => {
			this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
		});
	}

	public async initAchievementState() {
		// console.log('[perf] starting achievement process');
		const newState = Object.assign(new AchievementsState(), {
			globalCategories: await this.achievementsHelper.buildGlobalCategories(),
			achievementHistory: await this.buildAchievementHistory(),
			isLoading: false,
		} as AchievementsState);
		// console.log('[perf] built new achievements state');
		this.stateUpdater.next(new AchievementsInitEvent(newState));
	}

	private async buildAchievementHistory(): Promise<readonly AchievementHistory[]> {
		const [history, achievements] = await Promise.all([
			this.achievementHistoryStorage.loadAll(),
			this.achievementsLoader.getAchievements(),
		]);
		return (
			history
				.filter(history => history.numberOfCompletions === 1)
				.map(history => {
					const matchingAchievement = achievements.find(ach => ach.id === history.achievementId);
					// This can happen with older history items
					if (!matchingAchievement) {
						return null;
					}
					return Object.assign(new AchievementHistory(), history, {
						displayName: achievements.find(ach => ach.id === history.achievementId).displayName,
					} as AchievementHistory);
				})
				.filter(history => history)
				// We want to have the most recent at the top
				.reverse()
		);
	}
}
