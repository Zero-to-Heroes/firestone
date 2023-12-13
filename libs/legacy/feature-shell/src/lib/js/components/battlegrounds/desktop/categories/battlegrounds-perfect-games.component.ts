import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { ALL_BG_RACES, Race } from '@firestone-hs/reference-data';
import { PreferencesService } from '@firestone/shared/common/service';
import { deepEqual } from '@firestone/shared/framework/common';
import { GameStat } from '@firestone/stats/data-access';
import { BgsPerfectGamesService } from '@legacy-import/src/lib/js/services/battlegrounds/bgs-perfect-games.service';
import { BG_USE_ANOMALIES } from '@legacy-import/src/lib/js/services/feature-flags';
import { Observable, combineLatest } from 'rxjs';
import { filter, tap } from 'rxjs/operators';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { getMmrThreshold } from '../../../../services/ui-store/bgs-ui-helper';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

@Component({
	selector: 'battlegrounds-perfect-games',
	styleUrls: [
		`../../../../../css/component/battlegrounds/desktop/categories/battlegrounds-perfect-games.component.scss`,
	],
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
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit, OnDestroy
{
	replays$: Observable<readonly GameStat[]>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly perfectGames: BgsPerfectGamesService,
		private readonly prefs: PreferencesService,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		await this.perfectGames.isReady();
		await this.prefs.isReady();

		const filters$ = this.prefs.preferences$$.pipe(
			this.mapData(
				(prefs) => ({
					rankFilter: prefs.bgsActiveRankFilter,
					heroFilter: prefs.bgsActiveHeroFilter,
					anomaliesFilter: prefs.bgsActiveAnomaliesFilter,
					tribesFilter: prefs.bgsActiveTribesFilter,
				}),
				(a, b) => deepEqual(a, b),
			),
		);
		this.replays$ = combineLatest([
			this.perfectGames.perfectGames$$,
			this.store.listen$(([main, nav]) => main.battlegrounds.getMetaHeroStats()?.mmrPercentiles),
			filters$,
		]).pipe(
			filter(([perfectGames, [mmrPercentiles]]) => !!perfectGames?.length && !!mmrPercentiles?.length),
			this.mapData(([perfectGames, [mmrPercentiles], filters]) => {
				const mmrThreshold = getMmrThreshold(filters.rankFilter, mmrPercentiles);
				return this.applyFilters(
					perfectGames ?? [],
					mmrThreshold,
					filters.heroFilter,
					filters.tribesFilter,
					filters.anomaliesFilter,
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
	): readonly GameStat[] {
		return replays
			.filter((replay) => this.rankFilter(replay, rankFilter))
			.filter((replay) => this.heroFilter(replay, heroFilter))
			.filter((replay) => this.tribesFilter(replay, tribesFilter))
			.filter((replay) => (BG_USE_ANOMALIES ? this.anomaliesFilter(replay, anomaliesFilter) : true));
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
}
