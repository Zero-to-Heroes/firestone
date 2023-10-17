import { Injectable } from '@angular/core';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { ApiRunner } from '@firestone/shared/framework/core';
import { HsRefAchiementsData } from './hs-ref-achievement';

const REF_HS_ACHIEVEMENTS_RETRIEVE_URL = 'https://static.zerotoheroes.com/hearthstone/jsoncards/hs-achievements.json';

@Injectable()
export class AchievementsRefLoaderService {
	// Do it this way so that concurrent calls to the API don't trigger multiple calls
	public readonly refData$$ = new SubscriberAwareBehaviorSubject<HsRefAchiementsData | null>(null);

	// private readonly internaleRefData$$ = new BehaviorSubject<HsRefAchiementsData | null>(null);
	// private readonly triggerRefDataLoad$$ = new BehaviorSubject<boolean>(false);

	constructor(private readonly api: ApiRunner) {
		this.init();
	}

	private init() {
		console.log('[achievements-ref-loader] init');
		this.refData$$.onFirstSubscribe(async () => {
			console.debug('[achievements-ref-loader] will load ref data');
			const refData = await this.api.callGetApi<HsRefAchiementsData>(REF_HS_ACHIEVEMENTS_RETRIEVE_URL);
			console.debug('[achievements-ref-loader] ref data', refData);
			this.refData$$.next(refData);
		});

		// this.triggerRefDataLoad$$.pipe(distinctUntilChanged()).subscribe(async (trigger) => {
		// 	console.debug('[achievements-ref-loader] will load ref data', trigger);
		// 	if (!trigger) {
		// 		return;
		// 	}
		// 	const refData = await this.api.callGetApi<HsRefAchiementsData>(REF_HS_ACHIEVEMENTS_RETRIEVE_URL);
		// 	console.debug('ref data', refData);
		// 	this.internaleRefData$$.next(refData);
		// });
		// this.internaleRefData$$
		// 	.pipe(
		// 		tap((info) => console.debug('setting ref data', info)),
		// 		filter((data) => !!data?.achievements?.length && !!data.categories?.length),
		// 	)
		// 	.subscribe((data) => this.refData$$.next(data));
	}

	// private loadRefData(): void {
	// 	console.debug('loading ref data', this.refData$$.value, this.triggerRefDataLoad$$.value);
	// 	this.triggerRefDataLoad$$.next(true);
	// }

	// public async getLatestRefData(): Promise<HsRefAchiementsData> {
	// 	// this.loadRefData();
	// 	while (!this.refData$$.value?.achievements?.length) {
	// 		await sleep(100);
	// 	}
	// 	return this.refData$$.value;
	// }
}
