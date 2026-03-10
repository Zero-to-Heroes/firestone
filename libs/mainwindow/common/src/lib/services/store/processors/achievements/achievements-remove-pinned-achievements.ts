import { PreferencesService } from '@firestone/shared/common/service';
import {
	MainWindowState,
	MainWindowStoreEvent,
	NavigationState,
} from '../../store-internal';
import { Processor } from '../processor';

export class AchievementsRemovePinnedAchievementsEvent implements MainWindowStoreEvent {
	
	readonly eventName = AchievementsRemovePinnedAchievementsEvent.eventName

	constructor(public readonly achievementIds: readonly number[]) {}

	static readonly eventName = 'AchievementsRemovePinnedAchievementsEvent'
}

export class AchievementsRemovePinnedAchievementsProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: AchievementsRemovePinnedAchievementsEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState | null, NavigationState | null]> {
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
