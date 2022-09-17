import { Injectable } from '@angular/core';
import { ArchetypeConfig } from '@firestone-hs/categorize-deck/dist/archetype-service';
import { ArchetypeStats } from '@firestone-hs/cron-build-ranked-archetypes/dist/archetype-stats';
import { decode as decodeDeckstring } from '@firestone-hs/deckstrings';
import { BgsPostMatchStats } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { GameStat } from '../../../models/mainwindow/stats/game-stat';
import { GameStats } from '../../../models/mainwindow/stats/game-stats';
import { StatGameModeType } from '../../../models/mainwindow/stats/stat-game-mode.type';
import { ApiRunner } from '../../api-runner';
import { CardsFacadeService } from '../../cards-facade.service';
import { DeckHandlerService } from '../../decktracker/deck-handler.service';
import { getDefaultHeroDbfIdForClass } from '../../hs-utils';
import { isMercenaries } from '../../mercenaries/mercenaries-utils';
import { OverwolfService } from '../../overwolf.service';
import { PreferencesService } from '../../preferences.service';
import { decode } from '../../utils';

const GAME_STATS_ENDPOINT = 'https://api.firestoneapp.com/retrieveUserMatchStats/matchStats';
const ARCHETYPE_CONFIG_ENDPOINT = 'https://static.zerotoheroes.com/api/decks-config.json';
const ARCHETYPE_STATS_ENDPOINT = 'https://static.zerotoheroes.com/api/ranked-decks.json';

@Injectable()
export class GameStatsLoaderService {
	private gameStats: GameStats;

	constructor(
		private readonly api: ApiRunner,
		private readonly ow: OverwolfService,
		private readonly prefs: PreferencesService,
		private readonly handler: DeckHandlerService,
		private readonly allCards: CardsFacadeService,
	) {}

	public async retrieveArchetypesConfig(): Promise<readonly ArchetypeConfig[]> {
		const config = await this.api.callGetApi<readonly ArchetypeConfig[]>(ARCHETYPE_CONFIG_ENDPOINT);
		console.log('[game-stats-loader] retrieving archetype config');
		return config;
	}

	public async retrieveArchetypesStats(): Promise<ArchetypeStats> {
		const stats = await this.api.callGetApi<ArchetypeStats>(ARCHETYPE_STATS_ENDPOINT);
		console.log('[game-stats-loader] retrieving archetype stats');
		return stats;
	}

	public async retrieveStats(): Promise<GameStats> {
		const user = await this.ow.getCurrentUser();
		const prefs = await this.prefs.getPreferences();
		const input = {
			userId: user.userId,
			userName: user.username,
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
				const postMatchStats: BgsPostMatchStats =
					decoded == null
						? null
						: ({
								boardHistory: [decoded],
						  } as any);
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
			// Here we remove all the stats right at the source, so that we're sure that deleted decks don't
			// appear anywhere
			.filter(
				(stat) =>
					!prefs?.desktopDeckDeletes ||
					!prefs.desktopDeckDeletes[stat.playerDecklist]?.length ||
					prefs.desktopDeckDeletes[stat.playerDecklist][
						prefs.desktopDeckDeletes[stat.playerDecklist].length - 1
					] < stat.creationTimestamp,
			);
		this.gameStats = Object.assign(new GameStats(), {
			stats: stats,
		} as GameStats);
		console.log('[game-stats-loader] Retrieved game stats for user', this.gameStats.stats?.length);
		return this.gameStats;
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
