import { Injectable } from '@angular/core';
import { DuelsHeroStat } from '@firestone-hs/duels-global-stats/dist/stat';
import { DuelsStatTypeFilterType, filterDuelsHeroStats } from '@firestone/duels/data-access';
import { DuelsNavigationService, DuelsRun } from '@firestone/duels/general';
import { PreferencesService } from '@firestone/shared/common/service';
import { SubscriberAwareBehaviorSubject, arraysEqual, deepEqual } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	AppInjector,
	CardsFacadeService,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { combineLatest, distinctUntilChanged, map } from 'rxjs';
import { DuelsHeroPlayerStat } from '../../models/duels/duels-player-stats';
import { PatchesConfigService } from '../patches-config.service';
import { buildDuelsHeroPlayerStats, filterDuelsRuns } from '../ui-store/duels-ui-helper';
import { DuelsDecksProviderService } from './duels-decks-provider.service';
import { DuelsMetaStatsService } from './duels-meta-stats.service';

@Injectable()
export class DuelsHeroStatsService extends AbstractFacadeService<DuelsHeroStatsService> {
	public duelsHeroStats$$: SubscriberAwareBehaviorSubject<readonly DuelsHeroPlayerStat[]>;

	private prefs: PreferencesService;
	private nav: DuelsNavigationService;
	private patchesConfig: PatchesConfigService;
	private duelsDecks: DuelsDecksProviderService;
	private duelsMetaStats: DuelsMetaStatsService;
	private allCards: CardsFacadeService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'DuelsHeroStatsService', () => !!this.duelsHeroStats$$);
	}

	protected override assignSubjects() {
		this.duelsHeroStats$$ = this.mainInstance.duelsHeroStats$$;
	}

	protected async init() {
		this.duelsHeroStats$$ = new SubscriberAwareBehaviorSubject<readonly DuelsHeroPlayerStat[] | null>(null);
		this.prefs = AppInjector.get(PreferencesService);
		this.nav = AppInjector.get(DuelsNavigationService);
		this.patchesConfig = AppInjector.get(PatchesConfigService);
		this.duelsDecks = AppInjector.get(DuelsDecksProviderService);
		this.duelsMetaStats = AppInjector.get(DuelsMetaStatsService);
		this.allCards = AppInjector.get(CardsFacadeService);

		await Promise.all([this.prefs.isReady(), this.nav.isReady(), this.patchesConfig.isReady()]);

		this.duelsHeroStats$$.onFirstSubscribe(async () => {
			combineLatest([
				this.duelsDecks.duelsRuns$$,
				this.duelsMetaStats.duelsMetaStats$$,
				this.nav.heroSearchString$$,
				this.prefs.preferences$$.pipe(
					map((prefs) => ({
						statType: prefs.duelsActiveStatTypeFilter,
						gameMode: prefs.duelsActiveGameModeFilter,
						timeFilter: prefs.duelsActiveTimeFilter,
						heroFilter: prefs.duelsActiveHeroesFilter2,
						heroPowerFilter: prefs.duelsActiveHeroPowerFilter2,
						sigTreasureFilter: prefs.duelsActiveSignatureTreasureFilter2,
					})),
					distinctUntilChanged((a, b) => deepEqual(a, b)),
				),
				this.patchesConfig.currentDuelsMetaPatch$$,
			])
				.pipe(
					map(
						([
							runs,
							duelStats,
							heroSearchString,
							{ statType, gameMode, timeFilter, heroFilter, heroPowerFilter, sigTreasureFilter },
							patch,
						]) =>
							[
								filterDuelsHeroStats(
									duelStats?.heroes,
									heroFilter,
									heroPowerFilter,
									sigTreasureFilter,
									statType,
									this.allCards,
									heroSearchString,
								),
								filterDuelsRuns(
									runs,
									timeFilter,
									heroFilter,
									gameMode,
									null,
									patch,
									0,
									heroPowerFilter,
									sigTreasureFilter,
									statType,
								),
								statType,
							] as [readonly DuelsHeroStat[], readonly DuelsRun[], DuelsStatTypeFilterType],
					),
					distinctUntilChanged((a, b) => arraysEqual(a, b)),
					map(([duelStats, duelsRuns, statType]) =>
						buildDuelsHeroPlayerStats(duelStats, statType, duelsRuns),
					),
				)
				.subscribe(this.duelsHeroStats$$);
		});
	}
}
