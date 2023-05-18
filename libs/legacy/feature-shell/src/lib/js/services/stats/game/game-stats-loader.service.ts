import { Injectable } from '@angular/core';
import { decode as decodeDeckstring } from '@firestone-hs/deckstrings';
import { BgsPostMatchStats } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { ApiRunner, CardsFacadeService, DiskCacheService, OverwolfService } from '@firestone/shared/framework/core';
import { GameStat, StatGameModeType } from '@firestone/stats/data-access';
import { filter } from 'rxjs';
import { GameStats } from '../../../models/mainwindow/stats/game-stats';
import { PatchInfo } from '../../../models/patches';
import { DeckHandlerService } from '../../decktracker/deck-handler.service';
import { getDefaultHeroDbfIdForClass } from '../../hs-utils';
import { UpdateGameStatsEvent } from '../../mainwindow/store/events/stats/update-game-stats-event';
import { isMercenaries } from '../../mercenaries/mercenaries-utils';
import { PreferencesService } from '../../preferences.service';
import { AppUiStoreService } from '../../ui-store/app-ui-store.service';
import { decode } from '../../utils';

const GAME_STATS_ENDPOINT = 'https://lq32rsf3wgmmjxihavjplf5jfq0ntetn.lambda-url.us-west-2.on.aws/';
const ARCHETYPE_CONFIG_ENDPOINT = 'https://static.zerotoheroes.com/api/decks-config.json';
const ARCHETYPE_STATS_ENDPOINT = 'https://static.zerotoheroes.com/api/ranked-decks.json';

@Injectable()
export class GameStatsLoaderService {
	private gameStats: GameStats;

	private patchInfo: PatchInfo;

	constructor(
		private readonly api: ApiRunner,
		private readonly ow: OverwolfService,
		private readonly prefs: PreferencesService,
		private readonly handler: DeckHandlerService,
		private readonly allCards: CardsFacadeService,
		private readonly diskCache: DiskCacheService,
		private readonly store: AppUiStoreService,
	) {
		this.init();
	}

	private async init() {
		await this.store.initComplete();

		this.store
			.listen$(([main]) => main.stats?.gameStats)
			.pipe(filter(([gameStats]) => !!gameStats?.stats?.length))
			.subscribe(([gameStats]) => {
				console.debug('[game-stats-loader] updating local games');
				this.saveLocalStats(gameStats.stats);
			});
		this.store
			.listen$(([main]) => main.patchConfig?.patches)
			.pipe(filter(([patches]) => !!patches?.length))
			.subscribe(([patches]) => {
				const lastPatch = patches[patches.length - 1];
				this.patchInfo = lastPatch;
			});
	}

	public async retrieveStats(): Promise<GameStats> {
		const localStats = await this.loadLocalGameStats();
		if (!!localStats?.length) {
			console.log('[game-stats-loader] retrieved stats locally', localStats.length);
			const prefs = await this.prefs.getPreferences();
			return GameStats.create({
				stats: localStats
					.map((stat) => GameStat.create({ ...stat }))
					.filter((stat) => this.isCorrectPeriod(stat, prefs.replaysLoadPeriod))
					// Here we remove all the stats right at the source, so that we're sure that deleted decks don't
					// appear anywhere
					.filter(
						(stat) =>
							!prefs?.desktopDeckDeletes ||
							!prefs.desktopDeckDeletes[stat.playerDecklist]?.length ||
							prefs.desktopDeckDeletes[stat.playerDecklist][
								prefs.desktopDeckDeletes[stat.playerDecklist].length - 1
							] < stat.creationTimestamp,
					),
			});
		}

		return this.refreshGameStats(false);
	}

	public async clearGames() {
		console.log('[game-stats-loader] clearing games');
		await this.saveLocalStats([]);
		const stats = await this.refreshGameStats(false);
		this.store.send(new UpdateGameStatsEvent(stats.stats));
	}

	public async fullRefresh() {
		console.log('[game-stats-loader] triggering full refresh');
		const stats = await this.refreshGameStats(true);
		this.store.send(new UpdateGameStatsEvent(stats.stats));
	}

	private async refreshGameStats(fullRetrieve: boolean) {
		const user = await this.ow.getCurrentUser();
		const prefs = await this.prefs.getPreferences();
		const input = {
			userId: user.userId,
			userName: user.username,
			fullRetrieve: fullRetrieve,
		};
		// const input = {
		// 	userId: 'zerg',
		// };
		console.log('[game-stats-loader] retrieving stats', user);
		const data = await this.api.callPostApi(GAME_STATS_ENDPOINT, input);

		const endpointResult: readonly GameStat[] = (data as any)?.results ?? [];
		const stats: readonly GameStat[] = endpointResult
			.map((stat) => {
				const decoded = (stat as any).finalComp ? decode((stat as any).finalComp) : null;
				const postMatchStats: BgsPostMatchStats = decoded == null ? null : ({ boardHistory: [decoded] } as any);
				let playerInfoFromDeckstring = null;
				return {
					...stat,
					playerDecklist: isMercenaries(stat.gameMode)
						? stat.playerDecklist
						: this.handler.normalizeDeckstring(stat.playerDecklist),
					// Because old stats are corrupted
					runId: stat.creationTimestamp < new Date('2020-12-14').getTime() ? null : stat.runId,
					postMatchStats: postMatchStats,
					playerClass:
						stat.playerClass ??
						(playerInfoFromDeckstring =
							playerInfoFromDeckstring ??
							extractPlayerInfoFromDeckstring(stat.playerDecklist, this.allCards, stat.gameMode, stat))
							?.playerClass,
					playerCardId:
						stat.playerCardId ??
						(playerInfoFromDeckstring =
							playerInfoFromDeckstring ??
							extractPlayerInfoFromDeckstring(stat.playerDecklist, this.allCards, stat.gameMode, stat))
							?.playerCardId,
				};
			})
			.map((stat) => Object.assign(new GameStat(), stat))
			.filter((stat) => this.isCorrectPeriod(stat, prefs.replaysLoadPeriod));
		await this.saveLocalStats(stats);
		this.gameStats = GameStats.create({
			stats: stats
				// Here we remove all the stats right at the source, so that we're sure that deleted decks don't
				// appear anywhere
				// TODO: this isn't good, because it means that the "stats" field isn't a reliable representation of
				// all the user stats. What if they un-delete a deck somehow?
				.filter(
					(stat) =>
						!prefs?.desktopDeckDeletes ||
						!prefs.desktopDeckDeletes[stat.playerDecklist]?.length ||
						prefs.desktopDeckDeletes[stat.playerDecklist][
							prefs.desktopDeckDeletes[stat.playerDecklist].length - 1
						] < stat.creationTimestamp,
				),
		});
		console.log('[game-stats-loader] Retrieved game stats for user', this.gameStats.stats?.length);
		return this.gameStats;
	}

	private isCorrectPeriod(
		stat: GameStat,
		replaysLoadPeriod: 'all-time' | 'past-100' | 'last-patch' | 'past-7' | 'season-start',
	): boolean {
		switch (replaysLoadPeriod) {
			case 'season-start':
				const startOfMonthDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
				return stat.creationTimestamp >= startOfMonthDate.getTime();
			case 'last-patch':
				if (!this.patchInfo) {
					return false;
				}
				// See bgs-ui-helper
				return (
					stat.buildNumber >= this.patchInfo.number ||
					stat.creationTimestamp > new Date(this.patchInfo.date).getTime() + 24 * 60 * 60 * 1000
				);
			case 'past-7':
				const past7Date = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
				return stat.creationTimestamp >= past7Date.getTime();
			case 'past-100':
				const past100Date = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000);
				return stat.creationTimestamp >= past100Date.getTime();
			case 'all-time':
			default:
				return true;
		}
	}

	private async saveLocalStats(gameStats: readonly GameStat[]) {
		await this.diskCache.storeItem(DiskCacheService.DISK_CACHE_KEYS.USER_MATCH_HISTORY, gameStats);
	}

	private async loadLocalGameStats(): Promise<readonly GameStat[]> {
		return await this.diskCache.getItem(DiskCacheService.DISK_CACHE_KEYS.USER_MATCH_HISTORY);
	}
}

export const extractPlayerInfoFromDeckstring = (
	deckstring: string,
	allCards: CardsFacadeService,
	gameMode: StatGameModeType,
	info = null,
): { playerClass: string; playerCardId: string } => {
	if (gameMode !== 'ranked') {
		return null;
	}

	try {
		const deckDefinition = !!deckstring ? decodeDeckstring(deckstring) : null;
		const playerClassFromDeckstring = allCards
			.getCardFromDbfId(deckDefinition?.heroes[0])
			?.playerClass?.toLowerCase();
		const mainPlayerClass =
			!!playerClassFromDeckstring && playerClassFromDeckstring !== 'neutral' ? playerClassFromDeckstring : null;
		const playerCardId = allCards.getCardFromDbfId(getDefaultHeroDbfIdForClass(mainPlayerClass)).id;
		return { playerClass: mainPlayerClass, playerCardId: playerCardId };
	} catch (e) {
		console.error('could not extract info from deckstring', deckstring, info, e);
		return null;
	}
};
