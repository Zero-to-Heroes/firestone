import { MainWindowState } from '@models/mainwindow/main-window-state';
import { NavigationState } from '@models/mainwindow/navigation/navigation-state';
import { Processor } from '@services/mainwindow/store/processors/processor';
import { BattlegroundsMetaHeroStatsLoadedEvent } from '../../events/battlegrounds/bgs-meta-hero-stats-loaded-event';

export class BattlegroundsMetaHeroStatsLoadedProcessor implements Processor {
	public async process(
		event: BattlegroundsMetaHeroStatsLoadedEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const newState = currentState.update({
			battlegrounds: currentState.battlegrounds.update({
				metaHeroStats: event.stats,
			}),
		});
		return [newState, null];
	}
}
