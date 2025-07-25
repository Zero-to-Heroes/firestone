import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { ALL_BG_RACES, Race } from '@firestone-hs/reference-data';
import { BgsMetaHeroStatsService } from '@firestone/battlegrounds/common';
import { BG_USE_ANOMALIES, PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent, arraysEqual } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { GameStat } from '@firestone/stats/data-access';
import { BgsPerfectGamesService } from '@legacy-import/src/lib/js/services/battlegrounds/bgs-perfect-games.service';
import { Observable, combineLatest } from 'rxjs';
import { filter, tap } from 'rxjs/operators';
import { getMmrThreshold } from '../../../../services/ui-store/bgs-ui-helper';

@Component({
	selector: 'battlegrounds-perfect-games',
	styleUrls: [`./battlegrounds-perfect-games.component.scss`],
	template: `
		<div class="battlegrounds-perfect-games" *ngIf="{ replays: replays$ | async } as value">
			<with-loading [isLoading]="value.replays == null">
				<replays-list-view [replays]="value.replays"></replays-list-view>
			</with-loading>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsPerfectGamesComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit, OnDestroy
{
	replays$: Observable<readonly GameStat[]>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly perfectGames: BgsPerfectGamesService,
		private readonly prefs: PreferencesService,
		private readonly metaHeroStats: BgsMetaHeroStatsService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.perfectGames, this.prefs, this.metaHeroStats);

		const filters$ = this.prefs.preferences$$.pipe(
			this.mapData(
				(prefs) => ({
					rankFilter: prefs.bgsActiveRankFilter,
					heroFilter: prefs.bgsActiveHeroFilter,
					anomaliesFilter: [] as readonly string[], //prefs.bgsActiveAnomaliesFilter,
					tribesFilter: prefs.bgsActiveTribesFilter,
					compsFilter: prefs.bgsActiveCompsFilter,
				}),
				(a, b) =>
					a.rankFilter === b.rankFilter &&
					a.heroFilter === b.heroFilter &&
					arraysEqual(a.anomaliesFilter, b.anomaliesFilter) &&
					arraysEqual(a.tribesFilter, b.tribesFilter) &&
					arraysEqual(a.compsFilter, b.compsFilter),
			),
		);
		this.replays$ = combineLatest([
			this.perfectGames.perfectGames$$,
			this.metaHeroStats.metaHeroStats$$.pipe(this.mapData((stats) => stats?.mmrPercentiles)),
			filters$,
		]).pipe(
			filter(([perfectGames, mmrPercentiles]) => !!perfectGames?.length && !!mmrPercentiles?.length),
			this.mapData(([perfectGames, mmrPercentiles, filters]) => {
				const mmrThreshold = getMmrThreshold(filters.rankFilter, mmrPercentiles);
				return this.applyFilters(
					perfectGames ?? [],
					mmrThreshold,
					filters.heroFilter,
					filters.tribesFilter,
					filters.anomaliesFilter,
					filters.compsFilter,
				);
			}),
			tap((filteredReplays) => console.debug('[perfect-games] filtered replays', filteredReplays)),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private applyFilters(
		replays: readonly GameStat[],
		rankFilter: number,
		heroFilter: string,
		tribesFilter: readonly Race[],
		anomaliesFilter: readonly string[],
		compsFilter: readonly string[],
	): readonly GameStat[] {
		return replays
			.filter((replay) => this.rankFilter(replay, rankFilter))
			.filter((replay) => this.heroFilter(replay, heroFilter))
			.filter((replay) => this.tribesFilter(replay, tribesFilter))
			.filter((replay) => (BG_USE_ANOMALIES ? this.anomaliesFilter(replay, anomaliesFilter) : true))
			.filter((replay) => this.compsFilter(replay, compsFilter));
	}

	private tribesFilter(stat: GameStat, tribesFilter: readonly Race[]) {
		if (!tribesFilter?.length || tribesFilter.length === ALL_BG_RACES.length) {
			return true;
		}
		return tribesFilter.every((tribe) => stat.bgsAvailableTribes?.includes(tribe));
	}

	private anomaliesFilter(stat: GameStat, anomaliesFilter: readonly string[]) {
		if (!anomaliesFilter?.length) {
			return true;
		}
		return anomaliesFilter.some((anomaly) => stat.bgsAnomalies?.includes(anomaly));
	}

	private rankFilter(stat: GameStat, rankFilter: number) {
		if (!rankFilter) {
			return true;
		}
		return stat.playerRank && parseInt(stat.playerRank) >= rankFilter;
	}

	private heroFilter(stat: GameStat, heroFilter: string) {
		if (!heroFilter) {
			return true;
		}

		switch (heroFilter) {
			case 'all':
			case null:
				return true;
			default:
				return stat.playerCardId === heroFilter;
		}
	}

	private compsFilter(stat: GameStat, compsFilter: readonly string[]) {
		if (!compsFilter?.length) {
			return true;
		}
		return compsFilter.some((comp) => stat.bgsCompArchetype === comp);
	}
}
