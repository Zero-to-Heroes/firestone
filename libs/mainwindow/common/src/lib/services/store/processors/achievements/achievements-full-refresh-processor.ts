import { FirestoneRemoteAchievementsLoaderService } from '@firestone/achievements/common';
import {
	AchievementsFullRefreshEvent,
	MainWindowState,
	NavigationState,
} from '../../store-internal';
import { Processor } from '../processor';

export class AchievementsFullRefreshProcessor implements Processor {
	constructor(private readonly remoteAchievements: FirestoneRemoteAchievementsLoaderService) {}

	public async process(
		event: AchievementsFullRefreshEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState | null, NavigationState | null]> {
		this.remoteAchievements.loadAchievements();
		return [null, null];
	}
}
