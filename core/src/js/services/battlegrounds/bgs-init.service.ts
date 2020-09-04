import { EventEmitter, Injectable } from '@angular/core';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { BgsHeroStat } from '../../models/battlegrounds/stats/bgs-hero-stat';
import { BgsStats } from '../../models/battlegrounds/stats/bgs-stats';
import { BattlegroundsAppState } from '../../models/mainwindow/battlegrounds/battlegrounds-app-state';
import { BattlegroundsCategory } from '../../models/mainwindow/battlegrounds/battlegrounds-category';
import { BattlegroundsGlobalCategory } from '../../models/mainwindow/battlegrounds/battlegrounds-global-category';
import { BattlegroundsPersonalHeroesCategory } from '../../models/mainwindow/battlegrounds/categories/battlegrounds-personal-heroes-category';
import { BattlegroundsPersonalRatingCategory } from '../../models/mainwindow/battlegrounds/categories/battlegrounds-personal-rating-category';
import { GameStats } from '../../models/mainwindow/stats/game-stats';
import { Events } from '../events.service';
import { BgsAppInitEvent } from '../mainwindow/store/events/battlegrounds/bgs-app-init-event';
import { MainWindowStoreEvent } from '../mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../overwolf.service';
import { PatchesConfigService } from '../patches-config.service';
import { PreferencesService } from '../preferences.service';
import { BgsBuilderService } from './bgs-builder.service';
import { BgsGlobalStatsService } from './bgs-global-stats.service';
import { BgsStatUpdateParser } from './store/event-parsers/bgs-stat-update-parser';
import { BgsInitEvent } from './store/events/bgs-init-event';
import { BgsStatUpdateEvent } from './store/events/bgs-stat-update-event';
import { BattlegroundsStoreEvent } from './store/events/_battlegrounds-store-event';

@Injectable()
export class BgsInitService {
	private mainWindowStateUpdater: EventEmitter<MainWindowStoreEvent>;
	private bgsStateUpdater: EventEmitter<BattlegroundsStoreEvent>;

	constructor(
		private readonly events: Events,
		private readonly bgsGlobalStats: BgsGlobalStatsService,
		private readonly ow: OverwolfService,
		private readonly cards: AllCardsService,
		private readonly patchesService: PatchesConfigService,
		private readonly prefs: PreferencesService,
		private readonly bgsBuilder: BgsBuilderService,
	) {
		this.events.on(Events.MATCH_STATS_UPDATED).subscribe(event => {
			const newGameStats: GameStats = event.data[0];
			console.log('[bgs-init] match stats updated', newGameStats);
			this.bgsStateUpdater.next(new BgsStatUpdateEvent(newGameStats));
		});
		setTimeout(() => {
			this.bgsStateUpdater = this.ow.getMainWindow().battlegroundsUpdater;
			this.mainWindowStateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
		});
	}

	public async init(matchStats: GameStats): Promise<BgsStats> {
		console.log('[bgs-init] bgs init starting');
		const bgsGlobalStats: BgsStats = await this.bgsGlobalStats.loadGlobalStats();
		// console.log(
		// 	'[bgs-init] bgs got global stats',
		// 	bgsGlobalStats?.heroStats && bgsGlobalStats.heroStats.length > 0 && bgsGlobalStats.heroStats[0].tribesStat,
		// 	bgsGlobalStats,
		// );
		const bgsMatchStats = matchStats?.stats?.filter(stat => stat.gameMode === 'battlegrounds');
		if (!bgsMatchStats || bgsMatchStats.length === 0) {
			console.log('[bgs-init] no bgs match stats');
			this.bgsStateUpdater.next(new BgsInitEvent([], bgsGlobalStats));
			return;
		}
		// console.log('[bgs-init] bgsMatchStats', bgsMatchStats.length);
		const currentBattlegroundsMetaPatch = (await this.patchesService.getConf()).currentBattlegroundsMetaPatch;
		const bgsStatsForCurrentPatch = bgsMatchStats.filter(stat => stat.buildNumber >= currentBattlegroundsMetaPatch);
		// console.log(
		// 	'[bgs-init] bgsStatsForCurrentPatch',
		// 	bgsStatsForCurrentPatch.length,
		// 	currentBattlegroundsMetaPatch,
		// );
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
		this.bgsStateUpdater.next(new BgsInitEvent(bgsStatsForCurrentPatch, statsWithPlayer));

		// TODO: update after each BG match
		const battlegroundsAppState = await this.initBattlegoundsAppState(bgsGlobalStats);
		const bgsAppStateWithStats = await this.bgsBuilder.updateStats(
			battlegroundsAppState,
			matchStats,
			currentBattlegroundsMetaPatch,
		);
		this.mainWindowStateUpdater.next(new BgsAppInitEvent(bgsAppStateWithStats));
	}

	public async initBattlegoundsAppState(bgsGlobalStats: BgsStats): Promise<BattlegroundsAppState> {
		const globalCategories: readonly BattlegroundsGlobalCategory[] = [
			this.buildPersonalStatsGlobalCategory(),
			this.buildMetaStatsGlobalCategory(),
		];
		return BattlegroundsAppState.create({
			globalCategories: globalCategories,
			globalStats: bgsGlobalStats,
			loading: false,
		} as BattlegroundsAppState);
	}

	private buildPersonalStatsGlobalCategory(): BattlegroundsGlobalCategory {
		const categories: readonly BattlegroundsCategory[] = [
			this.buildPersonalHeroesCategory(),
			this.buildPersonalRatingCategory(),
			this.buildPersonalStatsCategory(),
			this.buildPersonalAICategory(),
		];
		return BattlegroundsGlobalCategory.create({
			id: 'bgs-global-category-personal-stats',
			name: 'Personal stats',
			enabled: true,
			categories: categories,
		} as BattlegroundsGlobalCategory);
	}

	private buildPersonalHeroesCategory(): BattlegroundsCategory {
		return BattlegroundsPersonalHeroesCategory.create({
			enabled: true,
		} as BattlegroundsPersonalHeroesCategory);
	}

	private buildPersonalRatingCategory(): BattlegroundsCategory {
		return BattlegroundsPersonalRatingCategory.create({
			enabled: true,
		} as BattlegroundsPersonalRatingCategory);
	}

	private buildPersonalStatsCategory(): BattlegroundsCategory {
		return BattlegroundsCategory.create({
			id: 'bgs-category-personal-stats',
			name: 'Stats',
			enabled: true,
		} as BattlegroundsCategory);
	}

	private buildPersonalAICategory(): BattlegroundsCategory {
		return BattlegroundsCategory.create({
			id: 'bgs-category-personal-ai',
			name: 'AI Coaching',
			enabled: false,
			disabledTooltip:
				'AI coaching is still in development. It will likely be a perk for subscribers, but nothing is decided yet. Thanks for your patience!',
		} as BattlegroundsCategory);
	}

	private buildMetaStatsGlobalCategory(): BattlegroundsGlobalCategory {
		return BattlegroundsGlobalCategory.create({
			id: 'bgs-global-category-meta-stats',
			name: 'Meta',
			enabled: false,
			disabledTooltip: 'Meta stats will likely arrive towards the end of the year. Thanks for your patience!',
		} as BattlegroundsGlobalCategory);
	}
}
