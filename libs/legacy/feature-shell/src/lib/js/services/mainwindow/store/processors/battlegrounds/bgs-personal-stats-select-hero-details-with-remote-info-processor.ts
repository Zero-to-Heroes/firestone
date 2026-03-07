import { BattlegroundsAppState, MainWindowState, NavigationState } from '@firestone/mainwindow/common';
import { BgsPersonalStatsSelectHeroDetailsWithRemoteInfoEvent } from '@firestone/mainwindow/common';
import { Processor } from '../processor';

export class BgsPersonalStatsSelectHeroDetailsWithRemoteInfoProcessor implements Processor {
	public async process(
		event: BgsPersonalStatsSelectHeroDetailsWithRemoteInfoEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
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
