import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { GameStat } from '../../../models/mainwindow/stats/game-stat';
import { GameStats } from '../../../models/mainwindow/stats/game-stats';
import { OverwolfService } from '../../overwolf.service';

const GAME_STATS_ENDPOINT = 'https://p3mfx6jmhc.execute-api.us-west-2.amazonaws.com/Prod';

@Injectable()
export class GameStatsLoaderService {
	private gameStats: GameStats;

	constructor(private http: HttpClient, private ow: OverwolfService) {}

	public async retrieveStats(expectedReviewId: string = undefined, retriesLeft = 10): Promise<GameStats> {
		console.log(
			'[game-stats-loader] retrieving stats',
			expectedReviewId,
			retriesLeft,
			this.gameStats && this.gameStats[0],
		);
		if (
			this.gameStats &&
			(!expectedReviewId || this.gameStats.stats.some(stat => stat.reviewId === expectedReviewId))
		) {
			return this.gameStats;
		}
		const user = await this.ow.getCurrentUser();
		const userId = user.userId || user.machineId || user.username;
		return new Promise<GameStats>(async resolve => {
			this.doRetrieve(userId, retriesLeft, resolve, expectedReviewId);
		});
	}

	private doRetrieve(userId: string, retrievesLeft: number, resolve, expectedReviewId: string) {
		// console.log('[game-stats-loader] in doRetrieve', userId, retrievesLeft);
		if (retrievesLeft <= 0) {
			console.error('[game-stats-loader] could not load stats');
			resolve(null);
			return;
		}
		const expectedReviewPath = expectedReviewId ? `/${expectedReviewId}` : '';
		this.http.get(`${GAME_STATS_ENDPOINT}/overwolf-${userId}${expectedReviewPath}`).subscribe(
			data => {
				// console.log('[game-stats-loader] received http data');
				const endpointResult: readonly GameStat[] = (data as any).results;
				if (!expectedReviewId || endpointResult.some(stat => stat.reviewId === expectedReviewId)) {
					this.gameStats = Object.assign(new GameStats(), {
						stats: endpointResult.map(stat => Object.assign(new GameStat(), stat)),
					} as GameStats);
					console.log('[game-stats-loader] Retrieved game stats for user');
					resolve(this.gameStats);
				} else {
					// console.log(
					// 	'[game-stats-loader] Could not retrieve game stats for user, retrying',
					// 	expectedReviewId,
					// 	endpointResult.length,
					// );
					setTimeout(() => this.doRetrieve(userId, retrievesLeft - 1, resolve, expectedReviewId), 2000);
				}
			},
			error => {
				console.log('[game-stats-loader] could not get stats', error);
				setTimeout(() => this.doRetrieve(userId, retrievesLeft - 1, resolve, expectedReviewId), 2000);
			},
		);
	}
}
