import { EventEmitter } from '@angular/core';
import { BattlegroundsAppState } from '../../../../../models/mainwindow/battlegrounds/battlegrounds-app-state';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { PreferencesService } from '../../../../preferences.service';
import { BgsRequestNewGlobalStatsLoadEvent } from '../../events/battlegrounds/bgs-request-new-global-stats-load-event';
import { BgsTribesFilterSelectedEvent } from '../../events/battlegrounds/bgs-tribes-filter-selected-event';
import { MainWindowStoreEvent } from '../../events/main-window-store-event';
import { Processor } from '../processor';

export class BgsTribesFilterSelectedProcessor implements Processor {
	constructor(
		private readonly prefs: PreferencesService,
		private readonly stateUpdater: EventEmitter<MainWindowStoreEvent>,
	) {}

	public async process(
		event: BgsTribesFilterSelectedEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		await this.prefs.updateBgsTribesFilter([...event.tribes].sort());
		const prefs = await this.prefs.getPreferences();
		this.stateUpdater.next(
			new BgsRequestNewGlobalStatsLoadEvent(prefs.bgsActiveTribesFilter, prefs.bgsActiveTimeFilter),
		);
		return [
			currentState.update({
				battlegrounds: currentState.battlegrounds.update({
					loading: true,
				} as BattlegroundsAppState),
			} as MainWindowState),
			null,
		];
	}
}
