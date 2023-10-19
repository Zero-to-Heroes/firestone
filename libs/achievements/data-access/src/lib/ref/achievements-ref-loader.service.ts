import { Injectable } from '@angular/core';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { ApiRunner } from '@firestone/shared/framework/core';
import { HsRefAchiementsData } from './hs-ref-achievement';

const REF_HS_ACHIEVEMENTS_RETRIEVE_URL = 'https://static.zerotoheroes.com/hearthstone/jsoncards/hs-achievements.json';

@Injectable()
export class AchievementsRefLoaderService {
	public readonly refData$$ = new SubscriberAwareBehaviorSubject<HsRefAchiementsData | null>(null);

	constructor(private readonly api: ApiRunner) {
		this.init();
	}

	private init() {
		this.refData$$.onFirstSubscribe(async () => {
			console.debug('[achievements-ref-loader] will load ref data');
			const refData = await this.api.callGetApi<HsRefAchiementsData>(REF_HS_ACHIEVEMENTS_RETRIEVE_URL);
			console.debug('[achievements-ref-loader] ref data', refData);
			this.refData$$.next(refData);
		});
	}
}
