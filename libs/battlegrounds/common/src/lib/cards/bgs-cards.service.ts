/* eslint-disable @typescript-eslint/no-use-before-define */
import { Injectable } from '@angular/core';
import { BgsCardStats } from '@firestone-hs/bgs-global-stats';
import { BgsActiveTimeFilterType } from '@firestone/battlegrounds/data-access';
import { PreferencesService } from '@firestone/shared/common/service';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { AbstractFacadeService, ApiRunner, AppInjector, WindowManagerService } from '@firestone/shared/framework/core';
import { map } from 'rxjs';

const BGS_CARDS_URL = 'https://static.zerotoheroes.com/api/bgs/card-stats/%timePeriod%/overview-from-hourly.gz.json';

@Injectable()
export class BattlegroundsCardsService extends AbstractFacadeService<BattlegroundsCardsService> {
	public cardStats$$: SubscriberAwareBehaviorSubject<BgsCardStats | null>;

	private prefs: PreferencesService;
	private api: ApiRunner;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'BattlegroundsCardsService', () => !!this.cardStats$$);
	}

	protected override assignSubjects() {
		this.cardStats$$ = this.mainInstance.cardStats$$;
	}

	protected async init() {
		this.cardStats$$ = new SubscriberAwareBehaviorSubject<BgsCardStats | null>(null);
		this.api = AppInjector.get(ApiRunner);
		this.prefs = AppInjector.get(PreferencesService);

		await this.prefs.isReady();

		this.cardStats$$.onFirstSubscribe(async () => {
			this.prefs.preferences$$
				.pipe(
					map((prefs) => ({
						timeFilter: prefs.bgsActiveTimeFilter,
					})),
				)
				.subscribe(async ({ timeFilter }) => {
					const cards = await this.loadCardsInternal(timeFilter);
					this.cardStats$$.next(cards);
				});
		});
	}

	public async loadCards(timeFilter: BgsActiveTimeFilterType): Promise<BgsCardStats | null> {
		return this.mainInstance.loadCardsInternal(timeFilter);
	}

	private async loadCardsInternal(timeFilter: BgsActiveTimeFilterType): Promise<BgsCardStats | null> {
		const url = BGS_CARDS_URL.replace('%timePeriod%', fixInvalidTimeSuffix(timeFilter ?? 'last-patch'));
		console.debug('[bgs-cards] loading cards', url);
		const cards: BgsCardStats | null = await this.api.callGetApi(url);
		console.debug('[bgs-cards] loaded cards', cards);
		return cards;
	}
}

const fixInvalidTimeSuffix = (timePeriod: string): BgsActiveTimeFilterType => {
	switch (timePeriod) {
		case 'past-7':
			return 'past-seven';
		case 'past-3':
			return 'past-three';
	}
	return timePeriod as BgsActiveTimeFilterType;
};
