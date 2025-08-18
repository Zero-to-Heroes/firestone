/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @angular-eslint/template/no-negated-async */
import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	OnDestroy,
	ViewRef,
} from '@angular/core';
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
import { BgsMetaCompositionStrategiesService } from '../services/bgs-meta-composition-strategies.service';
import { BattlegroundsCompsService } from './bgs-comps.service';
import { buildCompStats } from './bgs-meta-comp-stats';
import { BgsMetaCompStatTierItem } from './meta-comp.model';

@Component({
	standalone: false,
	selector: 'battlegrounds-meta-stats-comps',
	styleUrls: [`./battlegrounds-meta-stats-comps-columns.scss`, `./battlegrounds-meta-stats-comps.component.scss`],
	template: `
		<battlegrounds-meta-stats-comps-view
			[stats]="stats$ | async"
			[loading]="loading$ | async"
			[lastUpdate]="lastUpdate$ | async"
		></battlegrounds-meta-stats-comps-view>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsMetaStatsCompsComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit, OnDestroy
{
	stats$: Observable<readonly BgsMetaCompStatTierItem[]>;
	loading$: Observable<boolean>;
	lastUpdate$: Observable<Date | null>;

	private loading$$ = new BehaviorSubject<boolean>(true);

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly i18n: ILocalizationService,
		private readonly allCards: CardsFacadeService,
		private readonly prefs: PreferencesService,
		private readonly bgComps: BattlegroundsCompsService,
		private readonly compStrategies: BgsMetaCompositionStrategiesService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.bgComps, this.prefs, this.compStrategies);

		this.loading$ = this.loading$$.pipe(this.mapData((loading) => loading));
		const baseStats$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => ({
				timeFilter: prefs.bgsActiveTimeFilter,
				rankFilter: prefs.bgsActiveRankFilter,
			})),
			distinctUntilChanged((a, b) => a?.timeFilter === b?.timeFilter && a?.rankFilter === b?.rankFilter),
			tap(() => this.loading$$.next(true)),
			switchMap(({ timeFilter, rankFilter }) => this.bgComps.loadCompStats(timeFilter, rankFilter)),
			shareReplay(1),
			takeUntil(this.destroyed$),
		);
		this.stats$ = combineLatest([
			baseStats$,
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.bgsActiveRankFilter)),
			this.compStrategies.strategies$$.pipe(this.mapData((strategies) => strategies)),
		]).pipe(
			this.mapData(([stats, rankFilter, strategies]) => {
				return buildCompStats(stats?.compStats ?? [], rankFilter, strategies ?? [], this.allCards, this.i18n);
			}),
			shareReplay(1),
			takeUntil(this.destroyed$),
		);
		this.lastUpdate$ = baseStats$.pipe(this.mapData((stats) => (stats ? new Date(stats.lastUpdateDate) : null)));

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
