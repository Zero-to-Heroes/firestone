import { CommonModule } from '@angular/common';
import { AfterContentInit, ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BgsCompAdvice } from '@firestone-hs/content-craetor-input';
import { BattlegroundsCompsService, BgsMetaCompositionStrategiesService } from '@firestone/battlegrounds/common';
import { BattlegroundsViewModule, BgsMetaCompStatTierItem, buildCompStats, BattlegroundsMetaStatsCompsViewComponent } from '@firestone/battlegrounds/view';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { CardsFacadeService, ILocalizationService, waitForReady } from '@firestone/shared/framework/core';
import { createSlug, matchSlugToName } from '@firestone/shared/framework/common';
import {
	BehaviorSubject,
	Observable,
	combineLatest,
	distinctUntilChanged,
	filter,
	shareReplay,
	switchMap,
	take,
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
	@ViewChild('compsView') compsViewComponent: BattlegroundsMetaStatsCompsViewComponent;

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
		private readonly route: ActivatedRoute,
		private readonly router: Router,
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

		// Handle URL-based composition modal opening
		this.route.params.pipe(
			this.mapData((params) => params['compSlug']),
			distinctUntilChanged(),
			takeUntil(this.destroyed$),
		).subscribe((compSlug) => {
			if (compSlug) {
				this.handleCompositionSlug(compSlug);
			}
		});

		this.cdr.detectChanges();
	}

	private handleCompositionSlug(compSlug: string) {
		// Wait for stats to be available, then find and open the composition
		combineLatest([this.stats$, this.strategies$]).pipe(
			filter(([stats, strategies]) => !!stats?.length && !!strategies?.length),
			take(1),
		).subscribe(([stats, strategies]) => {
			const compositionNames = stats.map(stat => stat.name);
			const matchedName = matchSlugToName(compSlug, compositionNames);
			
			if (matchedName) {
				const composition = stats.find(stat => stat.name === matchedName);
				if (composition && this.compsViewComponent) {
					// Small delay to ensure the view component is ready
					setTimeout(() => {
						this.compsViewComponent.onCompositionClick(composition);
					}, 100);
				}
			} else {
				// If composition not found, redirect to compositions list
				this.router.navigate(['/battlegrounds/comps'], { replaceUrl: true });
			}
		});
	}

	generateCompositionUrl(composition: BgsMetaCompStatTierItem): string {
		const slug = createSlug(composition.name);
		return `/battlegrounds/comps/${slug}`;
	}
}
