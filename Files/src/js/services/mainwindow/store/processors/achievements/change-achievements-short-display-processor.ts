import { Processor } from '../processor';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { AchievementsState } from '../../../../../models/mainwindow/achievements-state';
import { ChangeAchievementsShortDisplayEvent } from '../../events/achievements/change-achievements-short-display-event';

export class ChangeAchievementsShortDisplayProcessor implements Processor {
	constructor() {}

	public async process(
		event: ChangeAchievementsShortDisplayEvent,
		currentState: MainWindowState,
	): Promise<MainWindowState> {
		const newState = Object.assign(new AchievementsState(), currentState.achievements, {
			shortDisplay: event.shortDisplay,
		} as AchievementsState);
		return Object.assign(new MainWindowState(), currentState, {
			achievements: newState,
			isVisible: true,
		} as MainWindowState);
	}
}
