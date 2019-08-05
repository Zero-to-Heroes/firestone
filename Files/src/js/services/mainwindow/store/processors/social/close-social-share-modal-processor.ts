import { Processor } from '../processor';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { AchievementsState } from '../../../../../models/mainwindow/achievements-state';
import { CloseSocialShareModalEvent } from '../../events/social/close-social-share-modal-event';

export class CloseSocialShareModalProcessor implements Processor {
	public async process(event: CloseSocialShareModalEvent, currentState: MainWindowState): Promise<MainWindowState> {
		const achievementState = Object.assign(new AchievementsState(), currentState.achievements, {
			sharingAchievement: undefined,
		} as AchievementsState);
		return Object.assign(new MainWindowState(), currentState, {
			achievements: achievementState,
		} as MainWindowState);
	}
}
