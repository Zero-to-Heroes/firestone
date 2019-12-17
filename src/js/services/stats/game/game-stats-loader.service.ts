import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { GameStat } from '../../../models/mainwindow/stats/game-stat';
import { GameStats } from '../../../models/mainwindow/stats/game-stats';
import { OverwolfService } from '../../overwolf.service';

const GAME_STATS_ENDPOINT = 'https://p3mfx6jmhc.execute-api.us-west-2.amazonaws.com/Prod';

@Injectable()
export class GameStatsLoaderService {
	private gameStats: GameStats;

	constructor(private http: HttpClient, private ow: OverwolfService, private logger: NGXLogger) {}

	public async retrieveStats(expectedReviewId: string = undefined, retriesLeft = 10): Promise<GameStats> {
		console.log('retrieving stats', expectedReviewId, retriesLeft, this.gameStats && this.gameStats[0]);
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
		if (retrievesLeft <= 0) {
			console.error('[game-stats-loader] could not load stats');
			resolve(null);
			return;
		}
		this.http.get(`${GAME_STATS_ENDPOINT}/overwolf-${userId}`).subscribe(
			data => {
				const endpointResult: readonly GameStat[] = (data as any).results;
				if (!expectedReviewId || endpointResult.some(stat => stat.reviewId === expectedReviewId)) {
					this.gameStats = Object.assign(new GameStats(), {
						stats: endpointResult,
					} as GameStats);
					console.log('[game-stats-loader] Retrieved game stats for user');
					resolve(this.gameStats);
				} else {
					console.log(
						'[game-stats-loader] Could not retrieve game stats for user',
						expectedReviewId,
						endpointResult[0],
					);
					setTimeout(() => this.doRetrieve(userId, retrievesLeft - 1, resolve, expectedReviewId), 1000);
				}
			},
			error => {
				console.log('could not get stats', error);
				setTimeout(() => this.doRetrieve(userId, retrievesLeft - 1, resolve, expectedReviewId), 1000);
			},
		);
	}
}
