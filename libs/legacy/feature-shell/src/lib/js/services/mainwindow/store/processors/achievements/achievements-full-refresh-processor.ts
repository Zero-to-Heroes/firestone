import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { FirestoneRemoteAchievementsLoaderService } from '../../../../achievement/data/firestone-remote-achievements-loader.service';
import { AchievementsFullRefreshEvent } from '../../events/achievements/achievements-full-refresh-event';
import { Processor } from '../processor';

export class AchievementsFullRefreshProcessor implements Processor {
	constructor(private readonly remoteAchievements: FirestoneRemoteAchievementsLoaderService) {}

	public async process(
		event: AchievementsFullRefreshEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		this.remoteAchievements.loadAchievements();
		return [null, null];
	}
}
