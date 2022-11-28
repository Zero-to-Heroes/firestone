import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { RemoteAchievementsService } from '../../../../achievement/remote-achievements.service';
import { AchievementsFullRefreshEvent } from '../../events/achievements/achievements-full-refresh-event';
import { Processor } from '../processor';

export class AchievementsFullRefreshProcessor implements Processor {
	constructor(private readonly remoteAchievements: RemoteAchievementsService) {}

	public async process(
		event: AchievementsFullRefreshEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		this.remoteAchievements.loadRemoteAchievements(false, true);
		return [null, null];
	}
}
