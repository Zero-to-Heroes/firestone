import { BattlegroundsAppState } from '../../../../../models/mainwindow/battlegrounds/battlegrounds-app-state';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { BgsPersonalStatsSelectHeroDetailsWithRemoteInfoEvent } from '../../events/battlegrounds/bgs-personal-stats-select-hero-details-with-remote-info-event';
import { Processor } from '../processor';

export class BgsPersonalStatsSelectHeroDetailsWithRemoteInfoProcessor implements Processor {
	public async process(
		event: BgsPersonalStatsSelectHeroDetailsWithRemoteInfoEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		console.debug('[gr] reassigning', event)
		const newBattlegrounds = currentState.battlegrounds.update({
			lastHeroPostMatchStats: event.lastHeroPostMatchStats,
			lastHeroPostMatchStatsHeroId: event.heroId,
		} as BattlegroundsAppState);
		return [
			currentState.update({
				battlegrounds: newBattlegrounds,
			} as MainWindowState),
			null,
		];
	}
}
