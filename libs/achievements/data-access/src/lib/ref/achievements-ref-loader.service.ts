import { Injectable } from '@angular/core';
import { ApiRunner } from '@firestone/shared/framework/core';
import { BehaviorSubject, distinctUntilChanged, filter } from 'rxjs';
import { HsRefAchiementsData } from './hs-ref-achievement';

const REF_HS_ACHIEVEMENTS_RETRIEVE_URL = 'https://static.zerotoheroes.com/hearthstone/jsoncards/hs-achievements.json';

@Injectable()
export class AchievementsRefLoaderService {
	// Do it this way so that concurrent calls to the API don't trigger multiple calls
	public readonly refData$$ = new BehaviorSubject<HsRefAchiementsData | null>(null);

	private readonly internaleRefData$$ = new BehaviorSubject<HsRefAchiementsData | null>(null);
	private readonly triggerRefDataLoad$$ = new BehaviorSubject<boolean>(false);

	constructor(private readonly api: ApiRunner) {
		this.init();
	}

	private init() {
		this.triggerRefDataLoad$$.pipe(distinctUntilChanged()).subscribe(async (trigger) => {
			if (!trigger) {
				return;
			}
			const refData = await this.api.callGetApi<HsRefAchiementsData>(REF_HS_ACHIEVEMENTS_RETRIEVE_URL);
			this.internaleRefData$$.next(refData);
		});
		this.internaleRefData$$
			.pipe(filter((data) => !!data?.achievements?.length && !!data.categories?.length))
			.subscribe((data) => this.refData$$.next(data));
	}

	public loadRefData(): void {
		this.triggerRefDataLoad$$.next(true);
	}
}
