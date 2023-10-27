import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { ArenaRewardsService } from '../../../../arena/arena-rewards.service';
import { ArenaRewardsUpdatedEvent } from '../../events/arena/arena-rewards-updated-event';
import { Processor } from '../processor';

export class ArenaRewardsUpdatedProcessor implements Processor {
	constructor(private readonly arenaRewards: ArenaRewardsService) {}

	public async process(
		event: ArenaRewardsUpdatedEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		this.arenaRewards.addRewards(event.rewards);
		return [null, null];
	}
}
