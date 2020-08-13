import { EventEmitter, Injectable } from '@angular/core';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { BgsHeroStat } from '../../models/battlegrounds/stats/bgs-hero-stat';
import { BgsStats } from '../../models/battlegrounds/stats/bgs-stats';
import { GameStats } from '../../models/mainwindow/stats/game-stats';
import { Events } from '../events.service';
import { OverwolfService } from '../overwolf.service';
import { PatchesConfigService } from '../patches-config.service';
import { BgsGlobalStatsService } from './bgs-global-stats.service';
import { BgsStatUpdateParser } from './store/event-parsers/bgs-stat-update-parser';
import { BgsInitEvent } from './store/events/bgs-init-event';
import { BgsStatUpdateEvent } from './store/events/bgs-stat-update-event';
import { BattlegroundsStoreEvent } from './store/events/_battlegrounds-store-event';

@Injectable()
export class BgsInitService {
	private stateUpdater: EventEmitter<BattlegroundsStoreEvent>;

	constructor(
		private readonly events: Events,
		private readonly bgsGlobalStats: BgsGlobalStatsService,
		private readonly ow: OverwolfService,
		private readonly cards: AllCardsService,
		private readonly patchesService: PatchesConfigService,
	) {
		this.events.on(Events.MATCH_STATS_UPDATED).subscribe(event => {
			const newGameStats: GameStats = event.data[0];
			console.log('[bgs-init] match stats updated', newGameStats);
			this.stateUpdater.next(new BgsStatUpdateEvent(newGameStats));
		});
		setTimeout(() => {
			this.stateUpdater = this.ow.getMainWindow().battlegroundsUpdater;
		});
	}

	public async init(matchStats: GameStats) {
		console.log('[bgs-init] bgs init starting');
		const bgsGlobalStats: BgsStats = await this.bgsGlobalStats.loadGlobalStats();
		console.log(
			'[bgs-init] bgs got global stats',
			bgsGlobalStats?.heroStats && bgsGlobalStats.heroStats.length > 0 && bgsGlobalStats.heroStats[0].tribesStat,
		);
		const bgsMatchStats = matchStats?.stats?.filter(stat => stat.gameMode === 'battlegrounds');
		if (!bgsMatchStats || bgsMatchStats.length === 0) {
			console.log('[bgs-init] no bgs match stats');
			this.stateUpdater.next(new BgsInitEvent([], bgsGlobalStats));
			return;
		}
		console.log('[bgs-init] bgsMatchStats', bgsMatchStats.length);
		const currentBattlegroundsMetaPatch = (await this.patchesService.getConf()).currentBattlegroundsMetaPatch;
		const bgsStatsForCurrentPatch = bgsMatchStats.filter(stat => stat.buildNumber >= currentBattlegroundsMetaPatch);
		console.log(
			'[bgs-init] bgsStatsForCurrentPatch',
			bgsStatsForCurrentPatch.length,
			currentBattlegroundsMetaPatch,
		);
		const heroStatsWithPlayer: readonly BgsHeroStat[] = BgsStatUpdateParser.buildHeroStats(
			bgsGlobalStats,
			bgsStatsForCurrentPatch,
			this.cards,
		);
		console.log(
			'[bgs-init] heroStatsWithPlayer',
			heroStatsWithPlayer.length > 0 && heroStatsWithPlayer[0].playerGamesPlayed,
		);
		const statsWithPlayer = bgsGlobalStats?.update({
			heroStats: heroStatsWithPlayer,
			currentBattlegroundsMetaPatch: currentBattlegroundsMetaPatch,
		} as BgsStats);
		// console.log('will send bgs init event', statsWithPlayer);
		this.stateUpdater.next(new BgsInitEvent(bgsStatsForCurrentPatch, statsWithPlayer));
	}
}
