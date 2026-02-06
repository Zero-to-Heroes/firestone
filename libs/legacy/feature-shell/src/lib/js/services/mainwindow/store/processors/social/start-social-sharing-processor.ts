import {
	MainWindowState,
	NavigationAchievements,
	NavigationState,
	SharingAchievement,
} from '@firestone/mainwindow/common';
import { StartSocialSharingEvent } from '../../events/social/start-social-sharing-event';
import { Processor } from '../processor';

export class StartSocialSharingProcessor implements Processor {
	public async process(
		event: StartSocialSharingEvent,
		currentState: MainWindowState,
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
