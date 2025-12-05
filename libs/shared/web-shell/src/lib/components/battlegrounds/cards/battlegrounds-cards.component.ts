import { CommonModule } from '@angular/common';
import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	Optional,
	ViewRef,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BattlegroundsCardsService, buildMinTurn } from '@firestone/battlegrounds/common';
import { BgsMetaCardStatTierItem, buildCardStats } from '@firestone/battlegrounds/data-access';
import { BattlegroundsViewModule } from '@firestone/battlegrounds/view';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { CardsFacadeService, waitForReady } from '@firestone/shared/framework/core';
import { combineLatest, distinctUntilChanged, filter, Observable, shareReplay, switchMap, takeUntil } from 'rxjs';
import { WebBattlegroundsFiltersComponent } from '../filters/_web-battlegrounds-filters.component';
import { WebBattlegroundsCardSearchComponent } from '../filters/search/web-battlegrounds-card-search.component';
import { WebBattlegroundsCardTierFilterDropdownComponent } from '../filters/web-battlegrounds-card-tier-filter-dropdown.component';
import { WebBattlegroundsCardTurnFilterDropdownComponent } from '../filters/web-battlegrounds-card-turn-filter-dropdown.component';
import { WebBattlegroundsCardTypeFilterDropdownComponent } from '../filters/web-battlegrounds-card-type-filter-dropdown.component';
import { WebBattlegroundsRankFilterDropdownComponent } from '../filters/web-battlegrounds-rank-filter-dropdown.component';
import { WebBattlegroundsTimeFilterDropdownComponent } from '../filters/web-battlegrounds-time-filter-dropdown.component';
import { WebBattlegroundsTribesFilterDropdownComponent } from '../filters/web-battlegrounds-tribes-filter-dropdown.component';

@Component({
	standalone: true,
	selector: 'battlegrounds-cards',
	templateUrl: './battlegrounds-cards.component.html',
	styleUrls: ['./battlegrounds-cards.component.scss'],
	imports: [
		CommonModule,

		BattlegroundsViewModule,

		WebBattlegroundsFiltersComponent,
		WebBattlegroundsRankFilterDropdownComponent,
		WebBattlegroundsTimeFilterDropdownComponent,
		WebBattlegroundsTribesFilterDropdownComponent,
		WebBattlegroundsCardTurnFilterDropdownComponent,
		WebBattlegroundsCardTierFilterDropdownComponent,
		WebBattlegroundsCardTypeFilterDropdownComponent,
		WebBattlegroundsCardSearchComponent,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsCardsComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	stats$: Observable<readonly BgsMetaCardStatTierItem[]>;
	totalGames$: Observable<number>;
	lastUpdate$: Observable<Date>;

	readonly defaultDate = new Date();

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly prefs: PreferencesService,
		private readonly metaCards: BattlegroundsCardsService,
		private readonly allCards: CardsFacadeService,
		@Optional() private readonly route: ActivatedRoute,
		@Optional() private readonly router: Router,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.metaCards, this.prefs);

		const baseStats$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => ({
				timeFilter: prefs.bgsActiveTimeFilter,
				rankFilter: prefs.bgsActiveRankFilter,
			})),
			distinctUntilChanged((a, b) => a?.timeFilter === b?.timeFilter && a?.rankFilter === b?.rankFilter),
			switchMap(({ timeFilter, rankFilter }) => this.metaCards.loadCardStats(timeFilter, rankFilter)),
			shareReplay(1),
			takeUntil(this.destroyed$),
		);
		this.stats$ = combineLatest([
			baseStats$,
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.bgsActiveCardsTiers)),
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.bgsActiveCardsTurn)),
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.bgsActiveTribesFilter)),
		]).pipe(
			this.mapData(([stats, cardTiers, turnNumber, tribesFilter]) => {
				const minTurn = buildMinTurn(cardTiers);
				return buildCardStats(stats?.cardStats ?? [], tribesFilter, minTurn, turnNumber, this.allCards);
			}),
			shareReplay(1),
			takeUntil(this.destroyed$),
		);
		this.totalGames$ = baseStats$.pipe(
			filter((stats) => !!stats),
			this.mapData((stats) => stats!.dataPoints),
		);
		this.lastUpdate$ = baseStats$.pipe(
			filter((stats) => !!stats),
			this.mapData((stats) => (stats?.lastUpdateDate ? new Date(stats.lastUpdateDate) : null)),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
