import { BattlegroundsNavigationService } from '@firestone/battlegrounds/common';
import { BgsSimulatorControllerService } from '@firestone/battlegrounds/simulator';
import { MainWindowNavigationService } from '@firestone/mainwindow/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';
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
		private readonly ow: OverwolfService,
		private readonly prefs: PreferencesService,
		private readonly controller: BgsSimulatorControllerService,
	) {}

	public async process(
		event: BattlegroundsMainWindowSelectBattleEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		console.debug('handling event', event);
		await waitForReady(this.controller);
		this.controller.initBattleWithSideEffects(event.faceOff);

		this.nav.selectedCategoryId$$.next('bgs-category-simulator');
		const prefs = await this.prefs.getPreferences();
		const collectionWindow = await this.ow.getCollectionWindow(prefs);
		console.debug('collectionWindow', collectionWindow, collectionWindow.isVisible);
		if (!collectionWindow.isVisible) {
			await this.ow.restoreWindow(collectionWindow.id);
		}

		this.mainNav.isVisible$$.next(true);
		this.mainNav.text$$.next(this.i18n.translateString('battlegrounds.sim.resimulating-battle'));
		this.mainNav.currentApp$$.next('battlegrounds');
		this.nav.currentView$$.next('list');
		this.nav.menuDisplayType$$.next('breadcrumbs');
		return [null, null];
	}
}
