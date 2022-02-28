import { LocalizationFacadeService } from '@services/localization-facade.service';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { BattlegroundsMainWindowSelectBattleEvent } from '../../events/battlegrounds/battlegrounds-main-window-select-battle-event';
import { Processor } from '../processor';

export class BattlegroundsMainWindowSelectBattleProcessor implements Processor {
	constructor(private readonly i18n: LocalizationFacadeService) {}

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
				text: this.i18n.translateString('battlegrounds.sim.resimulating-battle'),
				navigationBattlegrounds: navigationState.navigationBattlegrounds.update({
					currentView: 'list',
					menuDisplayType: 'breadcrumbs',
					selectedCategoryId: 'bgs-category-simulator',
				}),
			}),
		];
	}
}
