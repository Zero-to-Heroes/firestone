/* eslint-disable @typescript-eslint/no-use-before-define */
import { Injectable } from '@angular/core';
import { BgsTrinketStats } from '@firestone-hs/bgs-global-stats';
import { BgsActiveTimeFilterType } from '@firestone/battlegrounds/data-access';
import { PreferencesService } from '@firestone/shared/common/service';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { AbstractFacadeService, ApiRunner, AppInjector, WindowManagerService } from '@firestone/shared/framework/core';
import { map } from 'rxjs';

const BGS_TRINKETS_URL =
	'https://static.zerotoheroes.com/api/bgs/trinket-stats/%timePeriod%/overview-from-hourly.gz.json';

@Injectable()
export class BattlegroundsTrinketsService extends AbstractFacadeService<BattlegroundsTrinketsService> {
	public trinketStats$$: SubscriberAwareBehaviorSubject<BgsTrinketStats | null>;

	private prefs: PreferencesService;
	private api: ApiRunner;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'BattlegroundsTrinketsService', () => !!this.trinketStats$$);
	}

	protected override assignSubjects() {
		this.trinketStats$$ = this.mainInstance.trinketStats$$;
	}

	protected async init() {
		this.trinketStats$$ = new SubscriberAwareBehaviorSubject<BgsTrinketStats | null>(null);
		this.api = AppInjector.get(ApiRunner);
		this.prefs = AppInjector.get(PreferencesService);

		await this.prefs.isReady();

		this.trinketStats$$.onFirstSubscribe(async () => {
			this.prefs.preferences$$
				.pipe(
					map((prefs) => ({
						timeFilter: prefs.bgsActiveTimeFilter,
						rankFilter: prefs.bgsActiveRankFilter,
					})),
				)
				.subscribe(async ({ timeFilter, rankFilter }) => {
					const trinkets = await this.loadTrinketsInternal(timeFilter);
					this.trinketStats$$.next(trinkets);
				});
		});
	}

	public async loadTrinkets(timeFilter: BgsActiveTimeFilterType): Promise<BgsTrinketStats | null> {
		return this.mainInstance.loadTrinketsInternal(timeFilter);
	}

	private async loadTrinketsInternal(timeFilter: BgsActiveTimeFilterType): Promise<BgsTrinketStats | null> {
		const url = BGS_TRINKETS_URL.replace('%timePeriod%', fixInvalidTimeSuffix(timeFilter ?? 'last-patch'));
		console.debug('[bgs-quests] loading quests', url);
		const quests: BgsTrinketStats | null = await this.api.callGetApi(url);
		console.debug('[bgs-quests] loaded quests', quests);
		return quests;
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
