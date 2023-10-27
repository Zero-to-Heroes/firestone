import { EventEmitter, Injectable } from '@angular/core';
import { DuelsMetaHeroStatsAccessService } from '@firestone/duels/data-access';
import { OverwolfService } from '@firestone/shared/framework/core';
import { DuelsAdventureInfoService } from '@legacy-import/src/lib/js/services/duels/duels-adventure-info.service';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { ArenaState } from '../../../models/arena/arena-state';
import { DuelsState } from '../../../models/duels/duels-state';
import { AchievementsState } from '../../../models/mainwindow/achievements-state';
import { MainWindowState } from '../../../models/mainwindow/main-window-state';
import { FORCE_LOCAL_PROP, Preferences } from '../../../models/preferences';
import { ArenaStateBuilderService } from '../../arena/arena-state-builder.service';
import { BgsBestUserStatsService } from '../../battlegrounds/bgs-best-user-stats.service';
import { BgsGlobalStatsService } from '../../battlegrounds/bgs-global-stats.service';
import { BgsInitService } from '../../battlegrounds/bgs-init.service';
import { BattlegroundsQuestsService } from '../../battlegrounds/bgs-quests.service';
import { CardsInitService } from '../../cards-init.service';
import { ArenaRunParserService } from '../../decktracker/arena-run-parser.service';
import { DecktrackerStateLoaderService } from '../../decktracker/main/decktracker-state-loader.service';
import { DuelsLootParserService } from '../../duels/duels-loot-parser.service';
import { DuelsStateBuilderService } from '../../duels/duels-state-builder.service';
import { GlobalStatsService } from '../../global-stats/global-stats.service';
import { MercenariesMemoryCacheService } from '../../mercenaries/mercenaries-memory-cache.service';
import { PatchesConfigService } from '../../patches-config.service';
import { MemoryInspectionService } from '../../plugins/memory-inspection.service';
import { PreferencesService } from '../../preferences.service';
import { GameStatsLoaderService } from '../../stats/game/game-stats-loader.service';
import { StatsStateBuilderService } from '../../stats/stats-state-builder.service';
import { UserService } from '../../user.service';
import { sleep } from '../../utils';
import { CollectionBootstrapService } from './collection-bootstrap.service';
import { MainWindowStoreEvent } from './events/main-window-store-event';
import { StoreInitEvent } from './events/store-init-event';

@Injectable()
export class StoreBootstrapService {
	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly cardsInit: CardsInitService,
		private readonly ow: OverwolfService,
		private readonly init_UserService: UserService,
		private readonly prefs: PreferencesService,
		private readonly gameStatsLoader: GameStatsLoaderService,
		private readonly bgsInit: BgsInitService,
		private readonly bgsGlobalStats: BgsGlobalStatsService,
		private readonly init_bgsQuestsService: BattlegroundsQuestsService,
		private readonly decktrackerStateLoader: DecktrackerStateLoaderService,
		private readonly globalStats: GlobalStatsService,
		private readonly bestBgsStats: BgsBestUserStatsService,
		private readonly collectionBootstrap: CollectionBootstrapService,
		private readonly patchConfig: PatchesConfigService,
		private readonly duels: DuelsStateBuilderService,
		private readonly arena: ArenaStateBuilderService,
		private readonly dungeonLoot: DuelsLootParserService,
		private readonly arenaService: ArenaRunParserService,
		private readonly stats: StatsStateBuilderService,
		private readonly mercenariesMemory: MercenariesMemoryCacheService,
		private readonly memory: MemoryInspectionService,
		private readonly duelsMemoryCache: DuelsAdventureInfoService,
		private readonly i18n: LocalizationFacadeService,
		private readonly duelsAccess: DuelsMetaHeroStatsAccessService,
	) {
		setTimeout(() => {
			this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
		});
	}

	private async ready() {
		while (!this.stateUpdater) {
			await sleep(100);
		}
	}

	public async initStore(initialState: MainWindowState) {
		await this.ready();

		// First load for the FTUE
		const prefs = await this.prefs.getPreferences();
		const showFtue = !prefs.ftue.hasSeenGlobalFtue;
		// Early init to avoid having the navigation jump when restoring the app to the previous tab
		const windowStateForFtue = initialState.update({
			showFtue: showFtue,
		} as MainWindowState);
		this.stateUpdater.next(new StoreInitEvent(windowStateForFtue, false));

		// ==========================
		// TODO: Ideally, everything after this is handled as deferred subjects
		// ==========================
		// const battlegroundsAppState = await this.bgsInit.initBattlegoundsAppState(windowStateForFtue.battlegrounds);
		const newStatsState = this.stats.initState(windowStateForFtue.stats, prefs);
		const decktracker = this.decktrackerStateLoader.buildState(windowStateForFtue.decktracker, prefs);
		const newAchievementState = windowStateForFtue.achievements.update({
			filters: AchievementsState.buildFilterOptions(this.i18n),
		});
		const duelsStats: DuelsState = this.duels.initState(windowStateForFtue.duels);
		const arenaState: ArenaState = await this.arena.initState(windowStateForFtue.arena);
		const initialWindowState = windowStateForFtue.update({
			showFtue: !prefs.ftue.hasSeenGlobalFtue,
			achievements: newAchievementState,
			decktracker: decktracker,
			// battlegrounds: battlegroundsAppState,
			duels: duelsStats,
			arena: arenaState,
			mercenaries: windowStateForFtue.mercenaries,
			stats: newStatsState,
			initComplete: true,
		} as MainWindowState);
		this.stateUpdater.next(new StoreInitEvent(initialWindowState, true));
	}

	private async mergePrefs(prefs: Preferences, prefsFromRemote: Preferences): Promise<Preferences> {
		// console.log('not merging prefs for now, first needs to fix a bug');
		return prefs;

		if (!prefsFromRemote) {
			console.log('no remote prefs, using local prefs');
			return prefs;
		}

		if (
			prefs?.lastUpdateDate &&
			(!prefsFromRemote?.lastUpdateDate ||
				// Can happen if the remote prefs was not updated when closing the app
				prefsFromRemote.lastUpdateDate.getTime() < prefs.lastUpdateDate.getTime())
		) {
			console.warn(
				'not using remote prefs, they are older than local prefs',
				prefsFromRemote?.lastUpdateDate,
				prefs?.lastUpdateDate,
			);
			this.prefs.updateRemotePreferences();
			return prefs;
		}

		const merged: Preferences = {
			// Use local prefs first, so that by default we have all the positions and non-synched
			// properties with the right values. We then just update with the saved remote values
			...(prefs ?? prefsFromRemote),
		} as Preferences;

		const obj = new Preferences();
		for (const prop in obj) {
			const meta = Reflect.getMetadata(FORCE_LOCAL_PROP, obj, prop);
			if (meta && obj.hasOwnProperty(prop)) {
				merged[prop] = prefsFromRemote[prop] ?? prefs[prop];
			}
		}
		await this.prefs.savePreferences(merged);
		// if (!merged?.opponentOverlayPosition) {
		// 	console.warn('no-format', 'pref missing overlay position', merged, new Error().stack);
		// }
		return merged;
	}

	// private async initializeSocialShareUserInfo(): Promise<SocialShareUserInfo> {
	// 	console.log('[social] initializing social share user info');
	// 	const twitter = await this.ow.getTwitterUserInfo();
	// 	return Object.assign(new SocialShareUserInfo(), {
	// 		twitter: twitter,
	// 	} as SocialShareUserInfo);
	// }
}
