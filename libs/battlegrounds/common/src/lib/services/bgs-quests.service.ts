/* eslint-disable @typescript-eslint/no-use-before-define */
import { Injectable } from '@angular/core';
import { BgsQuestStats } from '@firestone-hs/bgs-global-stats';
import { BgsActiveTimeFilterType } from '@firestone/battlegrounds/data-access';
import { BgsRankFilterType, PreferencesService } from '@firestone/shared/common/service';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { AbstractFacadeService, ApiRunner, AppInjector, WindowManagerService } from '@firestone/shared/framework/core';

const BGS_QUESTS_URL =
	'https://static.zerotoheroes.com/api/bgs/quest-stats/mmr-%percentile%/%timePeriod%/overview-from-hourly.gz.json';

@Injectable()
export class BattlegroundsQuestsService extends AbstractFacadeService<BattlegroundsQuestsService> {
	public questStats$$: SubscriberAwareBehaviorSubject<BgsQuestStats | null>;

	private prefs: PreferencesService;
	private api: ApiRunner;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'BattlegroundsQuestsService', () => !!this.questStats$$);
	}

	protected override assignSubjects() {
		this.questStats$$ = this.mainInstance.questStats$$;
	}

	protected async init() {
		this.questStats$$ = new SubscriberAwareBehaviorSubject<BgsQuestStats | null>(null);
		this.api = AppInjector.get(ApiRunner);
		this.prefs = AppInjector.get(PreferencesService);

		await this.prefs.isReady();

		this.questStats$$.onFirstSubscribe(async () => {
			this.prefs
				.preferences$(
					(prefs) => prefs.bgsActiveTimeFilter,
					(prefs) => prefs.bgsActiveRankFilter,
				)
				.subscribe(async ([timeFilter, rankFilter]) => {
					const quests = await this.loadQuests(timeFilter, rankFilter);
					this.questStats$$.next(quests);
				});
		});
	}

	private async loadQuests(
		timeFilter: BgsActiveTimeFilterType,
		rankFilter: BgsRankFilterType,
	): Promise<BgsQuestStats | null> {
		const url = BGS_QUESTS_URL.replace('%timePeriod%', fixInvalidTimeSuffix(timeFilter ?? 'last-patch')).replace(
			'%percentile%',
			`${rankFilter ?? 100}`,
		);
		console.debug('[bgs-quests] loading quests', url);
		const quests: BgsQuestStats | null = await this.api.callGetApi(url);
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
