/* eslint-disable @typescript-eslint/no-use-before-define */
import { EventEmitter, Injectable } from '@angular/core';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { ArenaState } from '../../models/arena/arena-state';
import { ArenaCategory } from '../../models/mainwindow/arena/arena-category';
import { PatchInfo } from '../../models/patches';
import { ApiRunner } from '../api-runner';
import { Events } from '../events.service';
import { MainWindowStoreEvent } from '../mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../overwolf.service';
import { PreferencesService } from '../preferences.service';

@Injectable()
export class ArenaStateBuilderService {
	private mainWindowStateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly api: ApiRunner,
		private readonly ow: OverwolfService,
		private readonly prefs: PreferencesService,
		private readonly allCards: AllCardsService,
		private readonly events: Events,
	) {
		setTimeout(() => {
			this.mainWindowStateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
		});
	}

	public async initState(currentArenaMetaPatch: PatchInfo): Promise<ArenaState> {
		const prefs = await this.prefs.getPreferences();
		return ArenaState.create({
			categories: [
				ArenaCategory.create({
					id: 'arena-runs',
					name: 'My Runs',
					enabled: true,
					icon: undefined,
					categories: null,
				} as ArenaCategory),
			] as readonly ArenaCategory[],
			loading: false,
			activeHeroFilter: prefs.arenaActiveClassFilter,
			activeTimeFilter: prefs.arenaActiveTimeFilter,
			currentArenaMetaPatch: currentArenaMetaPatch,
		} as ArenaState);
	}
}
