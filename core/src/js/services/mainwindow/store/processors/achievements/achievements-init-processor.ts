import { AchievementsState } from '../../../../../models/mainwindow/achievements-state';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { AchievementsInitEvent } from '../../events/achievements/achievements-init-event';
import { Processor } from '../processor';

export class AchievementsInitProcessor implements Processor {
	constructor() {}

	public async process(event: AchievementsInitEvent, currentState: MainWindowState): Promise<MainWindowState> {
		const newAchievements = Object.assign(new AchievementsState(), currentState.achievements, event.newState);
		const result = Object.assign(new MainWindowState(), currentState, {
			achievements: newAchievements,
		} as MainWindowState);
		// console.log('[perf] returning new state in processor');
		return result;
	}
}
