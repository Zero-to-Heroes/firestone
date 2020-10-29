import { Injectable } from '@angular/core';
import { BgsStats } from '../../models/battlegrounds/stats/bgs-stats';
import { ApiRunner } from '../api-runner';

const BGS_STATS_RETRIEVE_URL = 'https://static-api.firestoneapp.com/retrieveBgsGlobalStats/{proxy+}?v=2';

@Injectable()
export class BgsGlobalStatsService {
	constructor(private readonly api: ApiRunner) {}

	public async loadGlobalStats(): Promise<BgsStats> {
		const postEvent = {
			useNewTable: true,
		};
		const result: any = await this.api.callGetApiWithRetries(BGS_STATS_RETRIEVE_URL);
		// console.log('result', result);
		const globalStats = BgsStats.create({
			heroStats: result.result.heroStats,
		} as BgsStats);
		return globalStats;
	}

	// private loadGlobalStatsInternal(callback, retriesLeft = 5) {
	// 	if (retriesLeft <= 0) {
	// 		console.error('Could not load bgs global stats', `${BGS_STATS_RETRIEVE_URL}`);
	// 		callback(null);
	// 		return;
	// 	}
	// 	this.http.get(`${BGS_STATS_RETRIEVE_URL}`).subscribe(
	// 		(result: any) => {
	// 			const globalStats = BgsStats.create({
	// 				heroStats: result.result.heroStats,
	// 			} as BgsStats);
	// 			console.log('loaded bgs-global-stats');
	// 			callback(globalStats);
	// 		},
	// 		error => {
	// 			setTimeout(() => this.loadGlobalStatsInternal(callback, retriesLeft - 1), 2000);
	// 		},
	// 	);
	// }
}
