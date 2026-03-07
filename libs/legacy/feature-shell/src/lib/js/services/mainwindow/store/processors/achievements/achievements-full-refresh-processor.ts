import { FirestoneRemoteAchievementsLoaderService } from '@firestone/achievements/common';
import { MainWindowState, NavigationState } from '@firestone/mainwindow/common';
import { AchievementsFullRefreshEvent } from '@firestone/mainwindow/common';
import { Processor } from '../processor';

export class AchievementsFullRefreshProcessor implements Processor {
	constructor(private readonly remoteAchievements: FirestoneRemoteAchievementsLoaderService) {}

	public async process(
		event: AchievementsFullRefreshEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		this.remoteAchievements.loadAchievements();
		return [null, null];
	}
}
