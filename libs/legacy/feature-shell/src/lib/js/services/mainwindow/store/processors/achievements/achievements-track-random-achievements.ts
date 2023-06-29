import { HsRefAchievement } from '@firestone/achievements/data-access';
import { shuffleArray, sortByProperties } from '@firestone/shared/framework/common';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { AchievementsManager } from '../../../../achievement/achievements-manager.service';
import { RemoteAchievementsService } from '../../../../achievement/remote-achievements.service';
import { PreferencesService } from '../../../../preferences.service';
import { MainWindowStoreEvent } from '../../events/main-window-store-event';
import { Processor } from '../processor';

export class AchievementsTrackRandomAchievementsEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'AchievementsTrackRandomAchievementsEvent';
	}

	public eventName(): string {
		return 'AchievementsTrackRandomAchievementsEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}

const EXCLUDED_ACHIEVEMENTS = [
	// Complete reward track
	(a: HsRefAchievement) => a.name === 'Track Attack',
];
export class AchievementsTrackRandomAchievementsProcessor implements Processor {
	constructor(
		private readonly prefs: PreferencesService,
		private readonly achievementsManager: AchievementsManager,
		private readonly remoteAchievements: RemoteAchievementsService,
	) {}

	public async process(
		event: AchievementsTrackRandomAchievementsEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const currentProgress = await this.achievementsManager.getAchievements(true);
		const refAchievements = await this.remoteAchievements.loadHsRawAchievements();

		const uncompleteAchievements = refAchievements
			.filter((a) => !EXCLUDED_ACHIEVEMENTS.some((exclude) => exclude(a)))
			.map((a) => {
				const progress = currentProgress.find((p) => p.id === a.id);
				return {
					...a,
					progress: progress?.progress || 0,
				};
			})
			.filter((a) => a.progress < a.quota);
		const onlyQuota1 = uncompleteAchievements.every((a) => a.quota === 1);
		const candidates = uncompleteAchievements.filter((a) => (onlyQuota1 ? true : a.quota > 1));
		const orderedCandidates = candidates.sort(sortByProperties((a) => [a.quota - a.progress]));
		const shortList = orderedCandidates.slice(0, 10);
		console.debug('[achievements-track-random-achievements] shortlist', shortList);
		const pickedAchievements = shuffleArray(shortList).slice(0, 3);
		const pickedAchievementIds = pickedAchievements.map((a) => a.id);

		const prefs = await this.prefs.getPreferences();
		const existingPinnedAchievements = prefs.pinnedAchievementIds || [];
		const newPinnedAchievements = [...existingPinnedAchievements, ...pickedAchievementIds];
		await this.prefs.savePreferences({
			...prefs,
			pinnedAchievementIds: newPinnedAchievements,
		});
		return [null, null];
	}
}
