import { EventEmitter, Injectable } from '@angular/core';
import { CardsFacadeService } from '@services/cards-facade.service';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { BgsStats } from '../../models/battlegrounds/stats/bgs-stats';
import { BattlegroundsAppState } from '../../models/mainwindow/battlegrounds/battlegrounds-app-state';
import { BattlegroundsCategory } from '../../models/mainwindow/battlegrounds/battlegrounds-category';
import { BattlegroundsPersonalHeroesCategory } from '../../models/mainwindow/battlegrounds/categories/battlegrounds-personal-heroes-category';
import { BattlegroundsPersonalStatsHeroDetailsCategory } from '../../models/mainwindow/battlegrounds/categories/battlegrounds-personal-stats-hero-details-category';
import { BgsHeroStatsFilterId } from '../../models/mainwindow/battlegrounds/categories/bgs-hero-stats-filter-id';
import { GameStat } from '../../models/mainwindow/stats/game-stat';
import { GameStats } from '../../models/mainwindow/stats/game-stats';
import { PatchInfo } from '../../models/patches';
import { ApiRunner } from '../api-runner';
import { Events } from '../events.service';
import { LocalStorageService } from '../local-storage';
import { BattlegroundsPerfectGamesLoadedEvent } from '../mainwindow/store/events/battlegrounds/bgs-perfect-games-loaded-event';
import { OverwolfService } from '../overwolf.service';
import { AppUiStoreFacadeService } from '../ui-store/app-ui-store-facade.service';
import { BgsStatUpdateEvent } from './store/events/bgs-stat-update-event';
import { BattlegroundsStoreEvent } from './store/events/_battlegrounds-store-event';

const RETRIEVE_PERFECT_GAMES_ENDPOINT = 'https://static.zerotoheroes.com/api/bgs-perfect-games.json';

@Injectable()
export class BgsInitService {
	private bgsStateUpdater: EventEmitter<BattlegroundsStoreEvent>;

	constructor(
		private readonly events: Events,
		private readonly ow: OverwolfService,
		private readonly cards: CardsFacadeService,
		private readonly api: ApiRunner,
		private readonly i18n: LocalizationFacadeService,
		private readonly localStorage: LocalStorageService,
		private readonly store: AppUiStoreFacadeService,
	) {
		this.events.on(Events.GAME_STATS_UPDATED).subscribe((event) => {
			const newGameStats: GameStats = event.data[0];
			console.log('[bgs-init] match stats updated');
			this.bgsStateUpdater?.next(new BgsStatUpdateEvent(newGameStats));
		});
		setTimeout(() => {
			this.bgsStateUpdater = this.ow.getMainWindow().battlegroundsUpdater;
		});
	}

	public async loadInitialPerfectGames() {
		const localPercectGames = this.localStorage.getItem<readonly GameStat[]>('battlegrounds-perfect-games');
		if (!!localPercectGames?.length) {
			console.debug('loaded local perfect games', localPercectGames);
			this.store.send(new BattlegroundsPerfectGamesLoadedEvent(localPercectGames));
		}

		const result = await this.api.callGetApi<readonly GameStat[]>(RETRIEVE_PERFECT_GAMES_ENDPOINT);
		console.debug('[bgs-init] perfect games', result);
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
		console.debug('loaded remote perfect games', remotePerfectGames);
		this.localStorage.setItem('battlegrounds-perfect-games', remotePerfectGames);
		this.store.send(new BattlegroundsPerfectGamesLoadedEvent(remotePerfectGames));
	}

	public async initBattlegoundsAppState(
		bgsGlobalStats: BgsStats,
		// perfectGames: readonly GameStat[],
		patch: PatchInfo,
	): Promise<BattlegroundsAppState> {
		const categories: readonly BattlegroundsCategory[] = [
			// BattlegroundsCategory.create({
			// 	id: 'bgs-category-overview',
			// 	name: this.i18n.translateString('app.battlegrounds.menu.overview'),
			// }),
			this.buildPersonalHeroesCategory(bgsGlobalStats),
			BattlegroundsCategory.create({
				id: 'bgs-category-personal-quests',
				name: this.i18n.translateString('app.battlegrounds.menu.quests'),
			}),
			BattlegroundsCategory.create({
				id: 'bgs-category-personal-rating',
				name: this.i18n.translateString('app.battlegrounds.menu.rating'),
			}),
			BattlegroundsCategory.create({
				id: 'bgs-category-personal-stats',
				name: this.i18n.translateString('app.battlegrounds.menu.records'),
			}),
			BattlegroundsCategory.create({
				id: 'bgs-category-perfect-games',
				name: this.i18n.translateString('app.battlegrounds.menu.perfect-games'),
			}),
			BattlegroundsCategory.create({
				id: 'bgs-category-simulator',
				name: this.i18n.translateString('app.battlegrounds.menu.simulator'),
			}),
		].filter((cat) => cat);
		return BattlegroundsAppState.create({
			categories: categories,
			globalStats: bgsGlobalStats,
			// perfectGames: perfectGames,
			loading: false,
			currentBattlegroundsMetaPatch: patch,
		} as BattlegroundsAppState);
	}

	private buildPersonalHeroesCategory(bgsGlobalStats: BgsStats): BattlegroundsCategory {
		const uniqueHeroes = [...new Set(bgsGlobalStats?.heroStats?.map((heroStat) => heroStat.cardId) ?? [])];
		const heroDetailCategories: readonly BattlegroundsCategory[] = uniqueHeroes.map((heroCardId) =>
			BattlegroundsPersonalStatsHeroDetailsCategory.create({
				id: 'bgs-category-personal-hero-details-' + heroCardId,
				name: this.cards.getCard(heroCardId)?.name,
				heroId: heroCardId,
				tabs: [
					'winrate-stats',
					// Graph is buggy at the moment, and is not super useful, so let's scrap it for now
					// 'mmr',
					'warband-stats',
					'final-warbands',
				] as readonly BgsHeroStatsFilterId[],
			} as BattlegroundsPersonalStatsHeroDetailsCategory),
		);
		return BattlegroundsPersonalHeroesCategory.create({
			name: this.i18n.translateString('app.battlegrounds.menu.heroes'),
			categories: heroDetailCategories,
		} as BattlegroundsPersonalHeroesCategory);
	}
}
