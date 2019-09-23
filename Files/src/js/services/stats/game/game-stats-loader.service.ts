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

	public async retrieveStats(): Promise<GameStats> {
		if (this.gameStats) {
			return this.gameStats;
		}
		const user = await this.ow.getCurrentUser();
		const userId = user.userId || user.machineId || user.username;
		const endpointResult: readonly GameStat[] = ((await this.http
			.get(`${GAME_STATS_ENDPOINT}/overwolf-${userId}`)
			.toPromise()) as any).results;
		this.gameStats = Object.assign(new GameStats(), {
			stats: endpointResult,
		} as GameStats);
		this.logger.debug('[game-stats-loader] Retrieved game stats for user');
		return this.gameStats;
	}
}
