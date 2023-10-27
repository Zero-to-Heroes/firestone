import { EventEmitter, Injectable } from '@angular/core';
import { ApiRunner, DiskCacheService, OverwolfService } from '@firestone/shared/framework/core';
import { GameStat } from '@firestone/stats/data-access';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { BattlegroundsPerfectGamesLoadedEvent } from '../mainwindow/store/events/battlegrounds/bgs-perfect-games-loaded-event';
import { GameStatsLoaderService } from '../stats/game/game-stats-loader.service';
import { AppUiStoreFacadeService } from '../ui-store/app-ui-store-facade.service';
import { BattlegroundsStoreEvent } from './store/events/_battlegrounds-store-event';

const RETRIEVE_PERFECT_GAMES_ENDPOINT = 'https://static.zerotoheroes.com/api/bgs-perfect-games.json';

@Injectable()
export class BgsInitService {
	private bgsStateUpdater: EventEmitter<BattlegroundsStoreEvent>;

	constructor(
		private readonly ow: OverwolfService,
		private readonly api: ApiRunner,
		private readonly i18n: LocalizationFacadeService,
		private readonly diskCache: DiskCacheService,
		private readonly store: AppUiStoreFacadeService,
		private readonly gameStats: GameStatsLoaderService,
	) {
		this.init();
	}

	private async init() {
		await this.gameStats.isReady();
		setTimeout(() => {
			this.bgsStateUpdater = this.ow.getMainWindow().battlegroundsUpdater;
		});
	}

	public async loadInitialPerfectGames() {
		const localPercectGames = await this.diskCache.getItem<readonly GameStat[]>(
			DiskCacheService.DISK_CACHE_KEYS.BATTLEGROUNDS_PERFECT_GAMES,
		);
		if (!!localPercectGames?.length) {
			this.store.send(new BattlegroundsPerfectGamesLoadedEvent(localPercectGames));
		}

		const result = await this.api.callGetApi<readonly GameStat[]>(RETRIEVE_PERFECT_GAMES_ENDPOINT);
		const remotePerfectGames: readonly GameStat[] = (result ?? [])
			.map((res) =>
				GameStat.create({
					...res,
					gameFormat: 'wild',
					gameMode: 'battlegrounds',
					additionalResult: '1',
					bgsPerfectGame: true,
				} as GameStat),
			)
			.filter((stat) => stat.playerRank);
		this.diskCache.storeItem(DiskCacheService.DISK_CACHE_KEYS.BATTLEGROUNDS_PERFECT_GAMES, remotePerfectGames);
		this.store.send(new BattlegroundsPerfectGamesLoadedEvent(remotePerfectGames));
	}
}
