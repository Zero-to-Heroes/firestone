/* eslint-disable @typescript-eslint/no-use-before-define */
import { EventEmitter, Injectable } from '@angular/core';
import { ArenaRewardInfo } from '@firestone-hs/api-arena-rewards/dist/retrieve-arena-rewards';
import { ApiRunner, OverwolfService } from '@firestone/shared/framework/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { ArenaState } from '../../models/arena/arena-state';
import { ArenaCategory } from '../../models/mainwindow/arena/arena-category';
import { PatchInfo } from '../../models/patches';
import { MainWindowStoreEvent } from '../mainwindow/store/events/main-window-store-event';
import { PreferencesService } from '../preferences.service';

const REWARDS_RETRIEVE_URL = 'https://api.firestoneapp.com/userArenaRewards/get/arenaRewards/{proxy+}';

@Injectable()
export class ArenaStateBuilderService {
	private mainWindowStateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly api: ApiRunner,
		private readonly ow: OverwolfService,
		private readonly prefs: PreferencesService,
		private readonly i18n: LocalizationFacadeService,
	) {
		setTimeout(() => {
			this.mainWindowStateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
		});
	}

	public async loadRewards(): Promise<readonly ArenaRewardInfo[]> {
		const currentUser = await this.ow.getCurrentUser();
		const result: any = await this.api.callPostApi(REWARDS_RETRIEVE_URL, {
			userId: currentUser.userId,
			userName: currentUser.username,
		});
		return result;
	}

	public async initState(currentArenaMetaPatch: PatchInfo, rewards: readonly ArenaRewardInfo[]): Promise<ArenaState> {
		const prefs = await this.prefs.getPreferences();
		return ArenaState.create({
			categories: [
				ArenaCategory.create({
					id: 'arena-runs',
					name: this.i18n.translateString('app.arena.menu.my-runs'),
					enabled: true,
					icon: undefined,
					categories: null,
				} as ArenaCategory),
			] as readonly ArenaCategory[],
			loading: false,
			activeHeroFilter: prefs.arenaActiveClassFilter,
			activeTimeFilter: prefs.arenaActiveTimeFilter,
			currentArenaMetaPatch: currentArenaMetaPatch,
			rewards: rewards,
		} as ArenaState);
	}
}
