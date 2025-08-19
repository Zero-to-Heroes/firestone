import { CommonModule } from '@angular/common';
import { AfterContentInit, ChangeDetectorRef, Component } from '@angular/core';
import { BgsCompAdvice } from '@firestone-hs/content-craetor-input';
import { BattlegroundsCompsService, BgsMetaCompositionStrategiesService } from '@firestone/battlegrounds/common';
import { BattlegroundsViewModule, BgsMetaCompStatTierItem, buildCompStats } from '@firestone/battlegrounds/view';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { CardsFacadeService, ILocalizationService, waitForReady } from '@firestone/shared/framework/core';
import {
	BehaviorSubject,
	Observable,
	combineLatest,
	distinctUntilChanged,
	shareReplay,
	switchMap,
	takeUntil,
	tap,
} from 'rxjs';
import { WebBattlegroundsFiltersComponent } from '../filters/_web-battlegrounds-filters.component';
import { WebBattlegroundsRankFilterDropdownComponent } from '../filters/web-battlegrounds-rank-filter-dropdown.component';
import { WebBattlegroundsTimeFilterDropdownComponent } from '../filters/web-battlegrounds-time-filter-dropdown.component';

@Component({
	standalone: true,
	selector: 'battlegrounds-compositions',
	templateUrl: './battlegrounds-compositions.component.html',
	styleUrls: ['./battlegrounds-compositions.component.scss'],
	imports: [
		CommonModule,

		BattlegroundsViewModule,
		WebBattlegroundsFiltersComponent,
		WebBattlegroundsRankFilterDropdownComponent,
		WebBattlegroundsTimeFilterDropdownComponent,
	],
})
export class BattlegroundsCompositionsComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	stats$: Observable<readonly BgsMetaCompStatTierItem[]>;
	lastUpdate$: Observable<Date>;
	strategies$: Observable<readonly BgsCompAdvice[]>;
	loading$: Observable<boolean>;

	private loading$$ = new BehaviorSubject<boolean>(true);

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly compStrategies: BgsMetaCompositionStrategiesService,
		private readonly metaComps: BattlegroundsCompsService,
		private readonly prefs: PreferencesService,
		private readonly i18n: ILocalizationService,
		private readonly allCards: CardsFacadeService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.compStrategies, this.metaComps, this.prefs);

		this.loading$ = this.loading$$.pipe(this.mapData((loading) => loading));
		const baseStats$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => ({
				timeFilter: prefs.bgsActiveTimeFilter,
				rankFilter: prefs.bgsActiveRankFilter,
			})),
			distinctUntilChanged((a, b) => a?.timeFilter === b?.timeFilter && a?.rankFilter === b?.rankFilter),
			tap(() => this.loading$$.next(true)),
			switchMap(({ timeFilter, rankFilter }) => this.metaComps.loadCompStats(timeFilter, rankFilter)),
			shareReplay(1),
			takeUntil(this.destroyed$),
		);
		this.strategies$ = this.compStrategies.strategies$$.pipe(this.mapData((strategies) => strategies));
		this.stats$ = combineLatest([
			baseStats$,
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.bgsActiveRankFilter)),
			this.strategies$,
		]).pipe(
			this.mapData(([stats, rankFilter, strategies]) => {
				return buildCompStats(stats?.compStats ?? [], rankFilter, strategies ?? [], this.allCards, this.i18n);
			}),
			shareReplay(1),
			takeUntil(this.destroyed$),
		);
		this.lastUpdate$ = baseStats$.pipe(this.mapData((stats) => (stats ? new Date(stats.lastUpdateDate) : null)));

		this.cdr.detectChanges();
	}
}
