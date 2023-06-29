import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { PreferencesService } from '../../../../preferences.service';
import { MainWindowStoreEvent } from '../../events/main-window-store-event';
import { Processor } from '../processor';

export class AchievementsRemovePinnedAchievementsEvent implements MainWindowStoreEvent {
	constructor(public readonly achievementIds: readonly number[]) {}

	public static eventName(): string {
		return 'AchievementsRemovePinnedAchievementsEvent';
	}

	public eventName(): string {
		return 'AchievementsRemovePinnedAchievementsEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}

export class AchievementsRemovePinnedAchievementsProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: AchievementsRemovePinnedAchievementsEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const prefs = await this.prefs.getPreferences();
		const existingPinnedAchievements = prefs.pinnedAchievementIds || [];
		const newPinnedAchievements = existingPinnedAchievements.filter((id) => !event.achievementIds.includes(id));
		await this.prefs.savePreferences({
			...prefs,
			pinnedAchievementIds: newPinnedAchievements,
		});
		return [null, null];
	}
}
