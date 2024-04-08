import { BattlegroundsNavigationService } from '@firestone/battlegrounds/common';
import { MainWindowNavigationService } from '@firestone/mainwindow/common';
import { LocalizationService } from '@services/localization.service';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { BattlegroundsMainWindowSelectBattleEvent } from '../../events/battlegrounds/battlegrounds-main-window-select-battle-event';
import { Processor } from '../processor';

export class BattlegroundsMainWindowSelectBattleProcessor implements Processor {
	constructor(
		private readonly i18n: LocalizationService,
		private readonly nav: BattlegroundsNavigationService,
		private readonly mainNav: MainWindowNavigationService,
	) {}

	public async process(
		event: BattlegroundsMainWindowSelectBattleEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const updatedSim = currentState.battlegrounds.customSimulationState.update({
			faceOff: event.faceOff,
		});

		this.nav.selectedCategoryId$$.next('bgs-category-simulator');
		this.mainNav.text$$.next(this.i18n.translateString('battlegrounds.sim.resimulating-battle'));
		return [
			currentState.update({
				battlegrounds: currentState.battlegrounds.update({
					customSimulationState: updatedSim,
				}),
			}),
			navigationState.update({
				currentApp: 'battlegrounds',
				navigationBattlegrounds: navigationState.navigationBattlegrounds.update({
					currentView: 'list',
					menuDisplayType: 'breadcrumbs',
				}),
			}),
		];
	}
}
