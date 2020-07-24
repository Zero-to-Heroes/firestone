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
		return new Promise<GameStats>(async resolve => {
			this.doRetrieve(user.userId, user.username, retriesLeft, resolve, expectedReviewId);
		});
	}

	private doRetrieve(userId: string, userName: string, retrievesLeft: number, resolve, expectedReviewId: string) {
		// console.log('[game-stats-loader] in doRetrieve', userId, retrievesLeft);
		if (retrievesLeft <= 0) {
			console.error('[game-stats-loader] could not load stats', userId, expectedReviewId);
			resolve(null);
			return;
		}
		const postObject = {
			userId: userId,
			userName: userName,
			uploaderToken: `overwolf-${userId}`,
			expectedReviewId: expectedReviewId,
		};
		this.http.post(GAME_STATS_ENDPOINT, postObject).subscribe(
			data => {
				// console.log('[game-stats-loader] received http data');
				const endpointResult: readonly GameStat[] = (data as any).results;
				if (!expectedReviewId || endpointResult.some(stat => stat.reviewId === expectedReviewId)) {
					this.gameStats = Object.assign(new GameStats(), {
						stats: endpointResult
							.map(stat => ({
								...stat,
								playerDecklist: this.deckParser.normalizeDeckstring(
									stat.playerDecklist,
									stat.playerCardId,
								),
							}))
							.map(stat => Object.assign(new GameStat(), stat)),
					} as GameStats);
					console.log('[game-stats-loader] Retrieved game stats for user');
					resolve(this.gameStats);
				} else {
					// console.log(
					// 	'[game-stats-loader] Could not retrieve game stats for user, retrying',
					// 	expectedReviewId,
					// 	endpointResult.length,
					// );
					setTimeout(
						() => this.doRetrieve(userId, userName, retrievesLeft - 1, resolve, expectedReviewId),
						2000,
					);
				}
			},
			error => {
				console.log('[game-stats-loader] could not get stats', error);
				setTimeout(() => this.doRetrieve(userId, userName, retrievesLeft - 1, resolve, expectedReviewId), 2000);
			},
		);
	}
}
