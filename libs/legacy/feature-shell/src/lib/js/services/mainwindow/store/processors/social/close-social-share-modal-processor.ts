import { MainWindowState, NavigationAchievements, NavigationState } from '@firestone/mainwindow/common';
import { CloseSocialShareModalEvent } from '../../events/social/close-social-share-modal-event';
import { Processor } from '../processor';

export class CloseSocialShareModalProcessor implements Processor {
	public async process(
		event: CloseSocialShareModalEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		return [
			null,
			navigationState.update({
				navigationAchievements: navigationState.navigationAchievements.update({
					sharingAchievement: undefined,
				} as NavigationAchievements),
			} as NavigationState),
		];
	}
}
