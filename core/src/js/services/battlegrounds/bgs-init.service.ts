import { EventEmitter, Injectable } from '@angular/core';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { BgsHeroStat } from '../../models/battlegrounds/stats/bgs-hero-stat';
import { BgsStats } from '../../models/battlegrounds/stats/bgs-stats';
import { GameStats } from '../../models/mainwindow/stats/game-stats';
import { Events } from '../events.service';
import { OverwolfService } from '../overwolf.service';
import { BgsGlobalStatsService } from './bgs-global-stats.service';
import { BgsInitEvent } from './store/events/bgs-init-event';
import { BattlegroundsStoreEvent } from './store/events/_battlegrounds-store-event';

@Injectable()
export class BgsInitService {
	private stateUpdater: EventEmitter<BattlegroundsStoreEvent>;

	constructor(
		private readonly events: Events,
		private readonly bgsGlobalStats: BgsGlobalStatsService,
		private readonly ow: OverwolfService,
		private readonly cards: AllCardsService,
	) {
		this.events.on(Events.MATCH_STATS_UPDATED).subscribe(event => {
			this.init(event.data[0]);
		});
		setTimeout(() => {
			this.stateUpdater = this.ow.getMainWindow().battlegroundsUpdater;
		});
	}

	private async init(matchStats: GameStats) {
		console.log('bgs init starting', matchStats);
		const bgsGlobalStats: BgsStats = await this.bgsGlobalStats.loadGlobalStats();
		console.log('bgs got global stats', bgsGlobalStats);
		const bgsMatchStats = matchStats.stats.filter(stat => stat.gameMode === 'battlegrounds');
		if (!bgsMatchStats || bgsMatchStats.length === 0) {
			console.log('no bgs match stats', matchStats);
			return;
		}
		const buildNumber = bgsMatchStats[0].buildNumber;
		const bgsStatsForCurrentPatch = bgsMatchStats.filter(stat => stat.buildNumber === buildNumber);

		const heroStatsWithPlayer: readonly BgsHeroStat[] = bgsGlobalStats.heroStats.map(heroStat => {
			const playerGamesPlayed = bgsStatsForCurrentPatch.filter(stat => stat.playerCardId === heroStat.id).length;
			const playerPopularity = (100 * playerGamesPlayed) / bgsStatsForCurrentPatch.length;
			return BgsHeroStat.create({
				...heroStat,
				top4: heroStat.top4 || 0,
				top1: heroStat.top1 || 0,
				name: this.cards.getCard(heroStat.id)?.name,
				playerGamesPlayed: playerGamesPlayed,
				playerPopularity: playerPopularity,
				playerAveragePosition:
					playerPopularity === 0
						? 0
						: bgsStatsForCurrentPatch
								.filter(stat => stat.playerCardId === heroStat.id)
								.map(stat => parseInt(stat.additionalResult))
								.reduce((a, b) => a + b, 0) / playerGamesPlayed,
				playerTop4:
					playerPopularity === 0
						? 0
						: bgsStatsForCurrentPatch
								.filter(stat => stat.playerCardId === heroStat.id)
								.map(stat => parseInt(stat.additionalResult))
								.filter(position => position <= 4).length / playerGamesPlayed,
				playerTop1:
					playerPopularity === 0
						? 0
						: bgsStatsForCurrentPatch
								.filter(stat => stat.playerCardId === heroStat.id)
								.map(stat => parseInt(stat.additionalResult))
								.filter(position => position == 1).length / playerGamesPlayed,
			} as BgsHeroStat);
		});
		const statsWithPlayer = bgsGlobalStats.update({
			heroStats: heroStatsWithPlayer,
		} as BgsStats);
		// console.log('will send bgs init event', statsWithPlayer);
		this.stateUpdater.next(new BgsInitEvent(bgsStatsForCurrentPatch, statsWithPlayer));
	}
}
