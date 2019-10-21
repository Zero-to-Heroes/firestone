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

	public async retrieveStats(retriesLeft = 5): Promise<GameStats> {
		if (this.gameStats) {
			return this.gameStats;
		}
		const user = await this.ow.getCurrentUser();
		const userId = user.userId || user.machineId || user.username;
		return new Promise<GameStats>(async resolve => {
			this.doRetrieve(userId, retriesLeft, resolve);
		});
	}

	private doRetrieve(userId: string, retrievesLeft: number, resolve) {
		if (retrievesLeft <= 0) {
			console.error('[game-stats-loader] could not load stats');
			resolve([]);
			return;
		}
		this.http.get(`${GAME_STATS_ENDPOINT}/overwolf-${userId}`).subscribe(
			data => {
				const endpointResult: readonly GameStat[] = (data as any).results;
				this.gameStats = Object.assign(new GameStats(), {
					stats: endpointResult,
				} as GameStats);
				this.logger.debug('[game-stats-loader] Retrieved game stats for user', this.gameStats);
				resolve(this.gameStats);
			},
			error => {
				console.log('could not get stats', error);
				this.doRetrieve(userId, retrievesLeft - 1, resolve);
			},
		);
	}
}
