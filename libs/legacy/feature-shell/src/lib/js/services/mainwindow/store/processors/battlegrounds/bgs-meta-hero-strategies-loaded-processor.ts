import { MainWindowState } from '@models/mainwindow/main-window-state';
import { NavigationState } from '@models/mainwindow/navigation/navigation-state';
import { Processor } from '@services/mainwindow/store/processors/processor';
import { BattlegroundsMetaHeroStrategiesLoadedEvent } from '../../events/battlegrounds/bgs-meta-hero-strategies-loaded-event';

export class BattlegroundsMetaHeroStrategiesLoadedProcessor implements Processor {
	public async process(
		event: BattlegroundsMetaHeroStrategiesLoadedEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const newState = currentState.update({
			battlegrounds: currentState.battlegrounds.update({
				metaHeroStrategies: event.stats,
			}),
		});
		return [newState, null];
	}
}
