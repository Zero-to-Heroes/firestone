import { Injectable } from '@angular/core';
import { CardIds } from '@firestone-hs/reference-data';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { ApiRunner } from '@firestone/shared/framework/core';
import { DuelsBucketsData } from '../../models/duels/duels-state';

const DUELS_BUCKETS_URL = 'https://static.zerotoheroes.com/api/duels/duels-buckets.gz.json';

@Injectable()
export class DuelsBucketsService {
	public duelsBuckets$$ = new SubscriberAwareBehaviorSubject<readonly DuelsBucketsData[]>(null);

	constructor(private readonly api: ApiRunner) {
		window['duelsBuckets'] = this;
		this.init();
	}

	private async init(): Promise<void> {
		this.duelsBuckets$$.onFirstSubscribe(async () => {
			const result: readonly DuelsBucketsData[] = await this.api.callGetApi(DUELS_BUCKETS_URL);
			console.log('[duels-buckets] loaded buckets data', result?.length);
			const buckets = result.filter((bucket) => bucket.bucketId !== CardIds.GroupLearningTavernBrawl) ?? [];
			this.duelsBuckets$$.next(buckets);
		});
	}
}
