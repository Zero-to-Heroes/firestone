import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { GameStat } from '../../../models/mainwindow/stats/game-stat';
import { GameStats } from '../../../models/mainwindow/stats/game-stats';
import { DeckParserService } from '../../decktracker/deck-parser.service';
import { OverwolfService } from '../../overwolf.service';

const GAME_STATS_ENDPOINT = 'https://api.firestoneapp.com/retrieveUserMatchStats/matchStats';

@Injectable()
export class GameStatsLoaderService {
	private gameStats: GameStats;

	constructor(private http: HttpClient, private ow: OverwolfService, private deckParser: DeckParserService) {}

	public async retrieveStats(retriesLeft = 5): Promise<GameStats> {
		const user = await this.ow.getCurrentUser();
		console.log('[game-stats-loader] retrieving stats', retriesLeft, user, this.gameStats && this.gameStats[0]);
		return new Promise<GameStats>(async resolve => {
			this.doRetrieve(user.userId, user.username, retriesLeft, resolve);
		});
	}

	private doRetrieve(userId: string, userName: string, retrievesLeft: number, resolve) {
		if (retrievesLeft <= 0) {
			console.error('[game-stats-loader] could not load stats', userId);
			resolve(null);
			return;
		}
		const postObject = {
			userId: userId,
			userName: userName,
			uploaderToken: `overwolf-${userId}`,
		};
		// const postObject = {
		// 	userId: 'OW_a0975eac-f2aa-465f-912e-84f16196397a',
		// 	// userName: userName,
		// 	// uploaderToken: `overwolf-${userId}`,
		// };
		this.http.post(GAME_STATS_ENDPOINT, postObject).subscribe(
			data => {
				const endpointResult: readonly GameStat[] = (data as any).results;
				this.gameStats = Object.assign(new GameStats(), {
					stats: endpointResult
						.map(stat => ({
							...stat,
							playerDecklist: this.deckParser.normalizeDeckstring(stat.playerDecklist, stat.playerCardId),
						}))
						.map(stat => Object.assign(new GameStat(), stat)) as readonly GameStat[],
				} as GameStats);
				console.log('[game-stats-loader] Retrieved game stats for user', this.gameStats.stats?.length);
				resolve(this.gameStats);
			},
			error => {
				console.log('[game-stats-loader] could not get stats', error);
				setTimeout(() => this.doRetrieve(userId, userName, retrievesLeft - 1, resolve), 2000);
			},
		);
	}
}
