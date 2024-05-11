import { EventEmitter } from '@angular/core';
import { PreferencesService } from '@firestone/shared/common/service';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { BgsTimeFilterSelectedEvent } from '../../events/battlegrounds/bgs-time-filter-selected-event';
import { MainWindowStoreEvent } from '../../events/main-window-store-event';
import { Processor } from '../processor';

export class BgsTimeFilterSelectedProcessor implements Processor {
	constructor(
		private readonly prefs: PreferencesService,
		private readonly stateUpdater: EventEmitter<MainWindowStoreEvent>,
	) {}

	public async process(
		event: BgsTimeFilterSelectedEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		await this.prefs.updateBgsTimeFilter(event.timeFilter);
		// const prefs = await this.prefs.getPreferences();
		// this.stateUpdater.next(
		// 	new BgsRequestNewGlobalStatsLoadEvent(prefs.bgsActiveTribesFilter, prefs.bgsActiveTimeFilter),
		// );
		return [null, null];
	}
}
