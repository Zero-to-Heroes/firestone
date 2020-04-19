import { SharingAchievement } from '../../../../../models/mainwindow/achievement/sharing-achievement';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationAchievements } from '../../../../../models/mainwindow/navigation/navigation-achievements';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { StartSocialSharingEvent } from '../../events/social/start-social-sharing-event';
import { Processor } from '../processor';

export class StartSocialSharingProcessor implements Processor {
	public async process(
		event: StartSocialSharingEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const sharingAchievement: SharingAchievement = {
			title: event.title,
			network: event.network,
			videoPath: event.videoPath,
			videoPathOnDisk: event.videoPathOnDisk,
			achievementName: event.achievementName,
		};
		const achievementState = navigationState.navigationAchievements.update({
			sharingAchievement: sharingAchievement,
		} as NavigationAchievements);
		return [
			null,
			navigationState.update({
				navigationAchievements: achievementState,
			} as NavigationState),
		];
	}
}
