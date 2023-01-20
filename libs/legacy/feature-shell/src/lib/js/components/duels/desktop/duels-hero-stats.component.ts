import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { combineLatest, Observable } from 'rxjs';
import { DuelsHeroSortFilterType } from '../../../models/duels/duels-hero-sort-filter.type';
import { DuelsHeroPlayerStat } from '../../../models/duels/duels-player-stats';
import { CardsFacadeService } from '../../../services/cards-facade.service';
import { DuelsStateBuilderService } from '../../../services/duels/duels-state-builder.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../abstract-subscription-store.component';

@Component({
	selector: 'duels-hero-stats',
	styleUrls: [`../../../../css/component/duels/desktop/duels-hero-stats.component.scss`],
	template: `
		<div *ngIf="stats$ | async as stats; else emptyState" class="duels-hero-stats" scrollable>
			<duels-hero-stat-vignette *ngFor="let stat of stats" [stat]="stat"></duels-hero-stat-vignette>
		</div>
		<ng-template #emptyState>
			<duels-empty-state></duels-empty-state>
		</ng-template>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsHeroStatsComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	stats$: Observable<readonly DuelsHeroPlayerStat[]>;

	constructor(
		private readonly allCards: CardsFacadeService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.stats$ = combineLatest(
			this.store.duelsHeroStats$(),
			this.store.listenPrefs$(
				(prefs) => prefs.duelsActiveHeroSortFilter,
				(prefs) => prefs.duelsHideStatsBelowThreshold,
			),
		).pipe(
			this.mapData(([stats, [heroSorting, hideThreshold]]) =>
				[...(stats ?? [])]
					.sort(this.sortBy(heroSorting))
					.filter((stat) =>
						hideThreshold ? stat.globalTotalMatches >= DuelsStateBuilderService.STATS_THRESHOLD : true,
					),
			),
		);
	}

	private sortBy(heroSorting: DuelsHeroSortFilterType): (a: DuelsHeroPlayerStat, b: DuelsHeroPlayerStat) => number {
		switch (heroSorting) {
			case 'games-played':
				return (a, b) => b.playerTotalMatches - a.playerTotalMatches;
			case 'global-winrate':
				return (a, b) => b.globalWinrate - a.globalWinrate;
			case 'player-winrate':
				return (a, b) => b.playerWinrate - a.playerWinrate;
		}
	}
}
