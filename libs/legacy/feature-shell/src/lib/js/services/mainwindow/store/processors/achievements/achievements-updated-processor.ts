import { Achievement } from '../../../../../models/achievement';
import { AchievementsState } from '../../../../../models/mainwindow/achievements-state';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { AchievementsUpdatedEvent } from '../../events/achievements/achievements-updated-event';
import { Processor } from '../processor';

export class AchievementsUpdatedProcessor implements Processor {
	public async process(
		event: AchievementsUpdatedEvent,
		currentState: MainWindowState,
	): Promise<[MainWindowState, NavigationState]> {
		let newState: AchievementsState = currentState.achievements;
		for (const update of event.achievements) {
			newState = newState.updateAchievement(
				Achievement.create({
					id: `hearthstone_game_${update.id}`,
					progress: update.progress,
				} as Achievement),
				'hearthstone_game',
			);
		}

		return [
			currentState.update({
				achievements: newState,
			} as MainWindowState),
			null,
		];
	}
}
