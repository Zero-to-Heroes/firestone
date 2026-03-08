import { BattlegroundsNavigationService } from '@firestone/battlegrounds/services';
import { BgsSimulatorControllerService } from '@firestone/battlegrounds/simulator';
import { PreferencesService } from '@firestone/shared/common/service';
import { IWindowHandlerService, waitForReady } from '@firestone/shared/framework/core';
import { ILocalizationService } from '@firestone/shared/framework/core';
import {
	BattlegroundsMainWindowSelectBattleEvent,
	MainWindowNavigationService,
	MainWindowState,
	NavigationState,
} from '../../store-internal';
import { Processor } from '../processor';

export class BattlegroundsMainWindowSelectBattleProcessor implements Processor {
	constructor(
		private readonly i18n: ILocalizationService,
		private readonly nav: BattlegroundsNavigationService,
		private readonly mainNav: MainWindowNavigationService,
		private readonly prefs: PreferencesService,
		private readonly controller: BgsSimulatorControllerService,
		private readonly windowHandler: IWindowHandlerService,
	) {}

	public async process(
		event: BattlegroundsMainWindowSelectBattleEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState | null, NavigationState | null]> {
		console.debug('handling event', event);
		await waitForReady(this.controller);
		this.controller.initBattleWithSideEffects(event.faceOff);

		this.nav.selectedCategoryId$$.next('bgs-category-simulator');
		const prefs = await this.prefs.getPreferences();

		const useOverlay = prefs.collectionUseOverlay;
		await this.windowHandler.showCollectionWindow(useOverlay);

		this.mainNav.isVisible$$.next(true);
		this.mainNav.text$$.next(this.i18n.translateString('battlegrounds.sim.resimulating-battle'));
		this.mainNav.currentApp$$.next('battlegrounds');
		this.nav.currentView$$.next('list');
		this.nav.menuDisplayType$$.next('breadcrumbs');
		return [null, null];
	}
}
