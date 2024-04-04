import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	ViewRef,
} from '@angular/core';
import { DuelsStatTypeFilterType } from '@firestone/duels/data-access';
import { DuelsHeroSortFilterType, DuelsMetaStats } from '@firestone/duels/view';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { CardsFacadeService, OverwolfService } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';
import { DuelsHeroStatsService } from '../../../services/duels/duels-hero-stats.service';
import { DuelsExploreDecksEvent } from '../../../services/mainwindow/store/events/duels/duels-explore-decks-event';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';

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
export class DuelsHeroStatsComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	stats$: Observable<readonly DuelsMetaStats[]>;
	sort$: Observable<DuelsHeroSortFilterType>;
	hideLowData$: Observable<boolean>;

	private currentType: DuelsStatTypeFilterType;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
		private readonly prefs: PreferencesService,
		private readonly heroStats: DuelsHeroStatsService,
		private readonly ow: OverwolfService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await Promise.all([this.prefs.isReady(), this.heroStats.isReady()]);

		this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.duelsActiveStatTypeFilter)).subscribe((type) => {
			this.currentType = type;
		});
		this.stats$ = this.heroStats.duelsHeroStats$$.pipe(
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
		this.sort$ = this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.duelsActiveHeroSortFilter));
		this.hideLowData$ = this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.duelsHideStatsBelowThreshold));

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	onStatsClicked(stat: DuelsMetaStats) {
		console.debug('stats clicked', stat);
		const heroCardId = this.currentType === 'hero' ? stat.cardId : null;
		const heroPowerCardId = this.currentType === 'hero-power' ? stat.cardId : null;
		const signatureTreasureCardId = this.currentType === 'signature-treasure' ? stat.cardId : null;
		const stateUpdater: EventEmitter<MainWindowStoreEvent> = this.ow.getMainWindow().mainWindowStoreUpdater;
		stateUpdater.next(new DuelsExploreDecksEvent(heroCardId, heroPowerCardId, signatureTreasureCardId));
	}
}
