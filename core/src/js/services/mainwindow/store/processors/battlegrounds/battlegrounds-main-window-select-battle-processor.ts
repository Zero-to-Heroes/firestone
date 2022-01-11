import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { BattlegroundsMainWindowSelectBattleEvent } from '../../events/battlegrounds/battlegrounds-main-window-select-battle-event';
import { Processor } from '../processor';

export class BattlegroundsMainWindowSelectBattleProcessor implements Processor {
	public async process(
		event: BattlegroundsMainWindowSelectBattleEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const updatedSim = currentState.battlegrounds.customSimulationState.update({
			faceOff: event.faceOff,
		});

		return [
			currentState.update({
				battlegrounds: currentState.battlegrounds.update({
					customSimulationState: updatedSim,
				}),
			}),
			navigationState.update({
				currentApp: 'battlegrounds',
				text: 'Resimulating battle',
				navigationBattlegrounds: navigationState.navigationBattlegrounds.update({
					currentView: 'list',
					menuDisplayType: 'breadcrumbs',
					selectedCategoryId: 'bgs-category-simulator',
				}),
			}),
		];
	}
}
