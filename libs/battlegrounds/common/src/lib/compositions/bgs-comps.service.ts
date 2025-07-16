/* eslint-disable @typescript-eslint/no-use-before-define */
import { Injectable } from '@angular/core';
import { BgsCompStats } from '@firestone-hs/bgs-global-stats';
import { BgsActiveTimeFilterType } from '@firestone/battlegrounds/data-access';
import { BgsRankFilterType, PreferencesService } from '@firestone/shared/common/service';
import { AbstractFacadeService, ApiRunner, AppInjector, WindowManagerService } from '@firestone/shared/framework/core';

const BGS_CARDS_URL = 'https://static.zerotoheroes.com/api/bgs/comp-stats/%timePeriod%/overview-from-hourly.gz.json';

@Injectable()
export class BattlegroundsCompsService extends AbstractFacadeService<BattlegroundsCompsService> {
	private prefs: PreferencesService;
	private api: ApiRunner;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'BattlegroundsCompsService', () => true);
	}

	// eslint-disable-next-line @typescript-eslint/no-empty-function
	protected override assignSubjects() {}

	protected async init() {
		this.api = AppInjector.get(ApiRunner);
		this.prefs = AppInjector.get(PreferencesService);

		await this.prefs.isReady();
	}

	public async loadCompStats(
		timeFilter: BgsActiveTimeFilterType,
		rankFilter: BgsRankFilterType,
	): Promise<BgsCompStats | null> {
		return this.mainInstance.loadCompStatsInternal(timeFilter, rankFilter);
	}

	private async loadCompStatsInternal(
		timeFilter: BgsActiveTimeFilterType,
		rankFilter: BgsRankFilterType,
	): Promise<BgsCompStats | null> {
		const url = BGS_CARDS_URL.replace('%timePeriod%', fixInvalidTimeSuffix(timeFilter ?? 'last-patch'));
		console.debug('[bgs-comps] loading comps', url);
		const comps: BgsCompStats | null = await this.api.callGetApi(url);
		console.debug('[bgs-comps] loaded comps', comps);
		return comps;
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
