import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { DuelsStatTypeFilterType } from '@firestone/duels/data-access';
import { DuelsHeroSortFilterType, DuelsMetaStats } from '@firestone/duels/view';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';
import { DuelsExploreDecksEvent } from '../../../services/mainwindow/store/events/duels/duels-explore-decks-event';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../abstract-subscription-store.component';

@Component({
	selector: 'duels-hero-stats',
	styleUrls: [`../../../../css/component/duels/desktop/duels-hero-stats.component.scss`],
	template: `
		<div *ngIf="stats$ | async as stats; else emptyState" class="duels-hero-stats" scrollable>
			<duels-meta-stats-view
				[stats]="stats"
				[sort]="sort$ | async"
				[hideLowData]="hideLowData$ | async"
				[hoverEffect]="true"
				(statsClicked)="onStatsClicked($event)"
			></duels-meta-stats-view>
		</div>
		<ng-template #emptyState>
			<duels-empty-state></duels-empty-state>
		</ng-template>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsHeroStatsComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	stats$: Observable<readonly DuelsMetaStats[]>;
	sort$: Observable<DuelsHeroSortFilterType>;
	hideLowData$: Observable<boolean>;

	private currentType: DuelsStatTypeFilterType;

	constructor(
		private readonly allCards: CardsFacadeService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.listenForBasicPref$((prefs) => prefs.duelsActiveStatTypeFilter).subscribe((type) => {
			this.currentType = type;
		});
		this.stats$ = this.store.duelsHeroStats$().pipe(
			this.mapData((stats) => {
				console.debug('[duels-hero-stats] received stats', stats);
				const tieredStats = stats?.map((stat) => {
					const card = this.allCards.getCard(stat.cardId);
					const result: DuelsMetaStats = {
						cardId: stat.cardId,
						cardName: card.name,
						globalRunsPlayed: stat.globalTotalMatches,
						globalPopularity: stat.globalPopularity,
						globalWinrate: stat.globalWinrate,
						placementDistribution: stat.globalWinDistribution.map((info) => ({
							wins: info.winNumber,
							percentage: info.value,
							runs: Math.round(info.value * stat.globalTotalMatches),
						})),
						playerRunsPlayed: stat.playerTotalMatches,
						playerWinrate: stat.playerWinrate,
					};
					return result;
				});
				console.debug('[duels-hero-stats] tieredStats', tieredStats);
				return tieredStats?.length > 0 ? tieredStats : null;
			}),
		);
		this.sort$ = this.listenForBasicPref$((prefs) => prefs.duelsActiveHeroSortFilter);
		this.hideLowData$ = this.listenForBasicPref$((prefs) => prefs.duelsHideStatsBelowThreshold);
	}

	onStatsClicked(stat: DuelsMetaStats) {
		console.debug('stats clicked', stat);
		const heroCardId = this.currentType === 'hero' ? stat.cardId : null;
		const heroPowerCardId = this.currentType === 'hero-power' ? stat.cardId : null;
		const signatureTreasureCardId = this.currentType === 'signature-treasure' ? stat.cardId : null;
		this.store.send(new DuelsExploreDecksEvent(heroCardId, heroPowerCardId, signatureTreasureCardId));
	}
}
