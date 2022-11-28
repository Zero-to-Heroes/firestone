import { MainWindowState } from '@models/mainwindow/main-window-state';
import { NavigationState } from '@models/mainwindow/navigation/navigation-state';
import { Processor } from '@services/mainwindow/store/processors/processor';
import { BattlegroundsPerfectGamesLoadedEvent } from '../../events/battlegrounds/bgs-perfect-games-loaded-event';

export class BattlegroundsPerfectGamesLoadedProcessor implements Processor {
	public async process(
		event: BattlegroundsPerfectGamesLoadedEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const newState = currentState.update({
			battlegrounds: currentState.battlegrounds.update({
				perfectGames: event.games,
			}),
		});
		console.debug('newState', newState, currentState, event.games);
		return [newState, null];
	}
}
