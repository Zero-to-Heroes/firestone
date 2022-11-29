import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { AchievementsRepository } from '../../../../achievement/achievements-repository.service';
import { AchievementsFullUpdatedEvent } from '../../events/achievements/achievements-full-updated-event';
import { Processor } from '../processor';

export class AchievementsFullUpdatedProcessor implements Processor {
	constructor(private readonly achievementsRepository: AchievementsRepository) {}

	public async process(
		event: AchievementsFullUpdatedEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		this.achievementsRepository.reloadAllAchievements();
		return [null, null];
	}
}
