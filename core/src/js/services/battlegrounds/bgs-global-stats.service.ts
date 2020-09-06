import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BgsStats } from '../../models/battlegrounds/stats/bgs-stats';

const BGS_STATS_RETRIEVE_URL = 'https://static-api.firestoneapp.com/retrieveBgsGlobalStats/{proxy+}';

@Injectable()
export class BgsGlobalStatsService {
	constructor(private readonly http: HttpClient) {}

	public async loadGlobalStats(): Promise<BgsStats> {
		return new Promise<BgsStats>((resolve, reject) => {
			this.loadGlobalStatsInternal(result => resolve(result));
		});
	}

	private loadGlobalStatsInternal(callback, retriesLeft = 5) {
		if (retriesLeft <= 0) {
			console.error('Could not load bgs global stats', `${BGS_STATS_RETRIEVE_URL}`);
			callback(null);
			return;
		}
		this.http.get(`${BGS_STATS_RETRIEVE_URL}`).subscribe(
			(result: any) => {
				const globalStats = BgsStats.create({
					heroStats: result.result.heroStats,
				} as BgsStats);
				console.log('loaded bgs-global-stats');
				callback(globalStats);
			},
			error => {
				setTimeout(() => this.loadGlobalStatsInternal(callback, retriesLeft - 1), 2000);
			},
		);
	}
}
