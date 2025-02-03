/* eslint-disable @typescript-eslint/no-use-before-define */
import { Injectable } from '@angular/core';
import { BgsCardStats } from '@firestone-hs/bgs-global-stats';
import { BgsActiveTimeFilterType } from '@firestone/battlegrounds/data-access';
import { BgsRankFilterType, PreferencesService } from '@firestone/shared/common/service';
import { AbstractFacadeService, ApiRunner, AppInjector, WindowManagerService } from '@firestone/shared/framework/core';

const BGS_CARDS_URL =
	'https://static.zerotoheroes.com/api/bgs/card-stats/mmr-%mmrPercentile%/%timePeriod%/overview-from-hourly.gz.json?v=8';

@Injectable()
export class BattlegroundsCardsService extends AbstractFacadeService<BattlegroundsCardsService> {
	private prefs: PreferencesService;
	private api: ApiRunner;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'BattlegroundsCardsService', () => true);
	}

	// eslint-disable-next-line @typescript-eslint/no-empty-function
	protected override assignSubjects() {}

	protected async init() {
		this.api = AppInjector.get(ApiRunner);
		this.prefs = AppInjector.get(PreferencesService);

		await this.prefs.isReady();
	}

	public async loadCardStats(
		timeFilter: BgsActiveTimeFilterType,
		rankFilter: BgsRankFilterType,
	): Promise<BgsCardStats | null> {
		return this.mainInstance.loadCardStatsInternal(timeFilter, rankFilter);
	}

	private async loadCardStatsInternal(
		timeFilter: BgsActiveTimeFilterType,
		rankFilter: BgsRankFilterType,
	): Promise<BgsCardStats | null> {
		const url = BGS_CARDS_URL.replace('%mmrPercentile%', rankFilter.toString()).replace(
			'%timePeriod%',
			fixInvalidTimeSuffix(timeFilter ?? 'last-patch'),
		);
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
