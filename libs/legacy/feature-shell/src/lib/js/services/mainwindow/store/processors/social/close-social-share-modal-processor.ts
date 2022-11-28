import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationAchievements } from '../../../../../models/mainwindow/navigation/navigation-achievements';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { CloseSocialShareModalEvent } from '../../events/social/close-social-share-modal-event';
import { Processor } from '../processor';

export class CloseSocialShareModalProcessor implements Processor {
	public async process(
		event: CloseSocialShareModalEvent,
		currentState: MainWindowState,
		stateHistory,
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
