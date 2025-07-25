/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @angular-eslint/template/no-negated-async */
import { Overlay, OverlayPositionBuilder, OverlayRef, PositionStrategy } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ComponentRef,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { PreferencesService } from '@firestone/shared/common/service';
import { SortCriteria, invertDirection } from '@firestone/shared/common/view';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { CardsFacadeService, ILocalizationService, getDateAgo, waitForReady } from '@firestone/shared/framework/core';
import {
	BehaviorSubject,
	Observable,
	Subscription,
	combineLatest,
	distinctUntilChanged,
	filter,
	shareReplay,
	switchMap,
	takeUntil,
	tap,
} from 'rxjs';
import { BgsMetaCompositionStrategiesService } from '../services/bgs-meta-composition-strategies.service';
import { BattlegroundsCompositionDetailsModalComponent } from './battlegrounds-composition-details-modal.component';
import { BattlegroundsCompsService } from './bgs-comps.service';
import { ColumnSortTypeComp, buildCompStats, buildCompTiers } from './bgs-meta-comp-stats';
import { BgsMetaCompStatTier, BgsMetaCompStatTierItem } from './meta-comp.model';

@Component({
	selector: 'battlegrounds-meta-stats-comps',
	styleUrls: [`./battlegrounds-meta-stats-comps-columns.scss`, `./battlegrounds-meta-stats-comps.component.scss`],
	template: `
		<ng-container *ngIf="{ loading: loading$ | async, tiers: tiers$ | async } as value">
			<section
				class="battlegrounds-meta-stats-comps"
				[attr.aria-label]="'Battlegrounds meta composition stats'"
				*ngIf="value.loading === false; else loadingState"
			>
				<div class="data-info">
					<div class="label" [fsTranslate]="'app.decktracker.meta.last-updated'"></div>
					<div class="value" [helpTooltip]="lastUpdateFull$ | async">{{ lastUpdate$ | async }}</div>
					<div class="separator">-</div>
					<div class="label" [fsTranslate]="'app.decktracker.meta.total-games'"></div>
					<div class="value">{{ totalGames$ | async }}</div>
				</div>

				<div class="expert-notification">
					<div class="text">
						<div class="text-header">
							{{ 'app.battlegrounds.compositions.contributors.header' | fsTranslate }}
							<div
								class="info"
								inlineSVG="assets/svg/info.svg"
								[helpTooltip]="'app.battlegrounds.compositions.contributors.info' | fsTranslate"
							></div>
						</div>
						<div class="text-body" [fsTranslate]="'app.battlegrounds.compositions.contributors.text'"></div>
					</div>
					<div class="expert-info">
						<div class="expert-details">
							<div class="expert-name">Slyders</div>
							<div class="expert-credentials">Multiple leaderboard #1 finishes</div>
							<div class="expert-links">
								<a class="link twitch-icon" href="https://www.twitch.tv/slyders_hs" target="_blank">
									<svg>
										<use xlink:href="assets/svg/sprite.svg#twitch" />
									</svg>
								</a>
							</div>
						</div>
						<div class="expert-picture">
							<img
								src="https://static.zerotoheroes.com/hearthstone/asset/firestone/images/partners/slyders.png"
								alt="Expert Picture"
							/>
						</div>
					</div>
				</div>

				<div class="header" *ngIf="sortCriteria$ | async as sort">
					<div class="cell name" [fsTranslate]="'app.battlegrounds.compositions.columns.name'"></div>
					<sortable-table-label
						class="cell first-percent"
						[name]="'app.battlegrounds.compositions.columns.first-percent' | fsTranslate"
						[helpTooltip]="'app.battlegrounds.compositions.columns.first-percent-tooltip' | fsTranslate"
						[sort]="sort"
						[criteria]="'first'"
						(sortClick)="onSortClick($event)"
					>
					</sortable-table-label>
					<sortable-table-label
						class="cell average-placement"
						[name]="'app.battlegrounds.compositions.columns.position' | fsTranslate"
						[helpTooltip]="'app.battlegrounds.compositions.columns.position-tooltip' | fsTranslate"
						[sort]="sort"
						[criteria]="'position'"
						(sortClick)="onSortClick($event)"
					>
					</sortable-table-label>
					<sortable-table-label
						class="cell expert-rating"
						[name]="'app.battlegrounds.compositions.columns.expert-rating' | fsTranslate"
						[helpTooltip]="'app.battlegrounds.compositions.columns.expert-rating-tooltip' | fsTranslate"
						[sort]="sort"
						[criteria]="'expert-rating'"
						(sortClick)="onSortClick($event)"
					>
					</sortable-table-label>
					<sortable-table-label
						class="cell expert-difficulty"
						[name]="'app.battlegrounds.compositions.columns.expert-difficulty' | fsTranslate"
						[helpTooltip]="'app.battlegrounds.compositions.columns.expert-difficulty-tooltip' | fsTranslate"
						[sort]="sort"
						[criteria]="'expert-difficulty'"
						(sortClick)="onSortClick($event)"
					>
					</sortable-table-label>
					<div
						class="cell cards core"
						[fsTranslate]="'app.battlegrounds.compositions.columns.core-cards'"
					></div>
					<div
						class="cell cards addon"
						[fsTranslate]="'app.battlegrounds.compositions.columns.addon-cards'"
					></div>
				</div>
				<div class="comps-list" role="list" scrollable>
					<ng-container *ngIf="sortCriteria$ | async as sort">
						<ng-container [ngSwitch]="sort.criteria">
							<ng-container *ngSwitchCase="'position'">
								<battlegrounds-meta-stats-comps-tier
									*ngFor="let tier of value.tiers; trackBy: trackByFn"
									role="listitem"
									[tier]="tier"
									(compositionClick)="onCompositionClick($event)"
								></battlegrounds-meta-stats-comps-tier>
							</ng-container>
							<ng-container *ngSwitchCase="'first'">
								<battlegrounds-meta-stats-comps-tier
									*ngFor="let tier of value.tiers; trackBy: trackByFn"
									role="listitem"
									[tier]="tier"
									(compositionClick)="onCompositionClick($event)"
								></battlegrounds-meta-stats-comps-tier>
							</ng-container>
							<ng-container *ngSwitchDefault>
								<battlegrounds-meta-stats-comps-tier
									*ngFor="let tier of value.tiers; trackBy: trackByFn"
									class="single-tier"
									role="listitem"
									[tier]="tier"
									(compositionClick)="onCompositionClick($event)"
								></battlegrounds-meta-stats-comps-tier>
							</ng-container>
						</ng-container>
					</ng-container>
				</div>
			</section>
			<ng-template #loadingState>
				<battlegrounds-empty-state
					[subtitle]="'Loading data'"
					[emptyStateIcon]="'Please wait while we load the data'"
				></battlegrounds-empty-state
			></ng-template>
		</ng-container>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsMetaStatsCompsComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit, OnDestroy
{
	tiers$: Observable<readonly BgsMetaCompStatTier[]>;
	loading$: Observable<boolean>;

	lastUpdate$: Observable<string | null>;
	lastUpdateFull$: Observable<string | null>;
	totalGames$: Observable<string>;

	sortCriteria$: Observable<SortCriteria<ColumnSortTypeComp>>;

	headerCollapsed = true;

	private sortCriteria$$ = new BehaviorSubject<SortCriteria<ColumnSortTypeComp>>({
		criteria: 'first',
		direction: 'desc',
	});
	private loading$$ = new BehaviorSubject<boolean>(true);

	private overlayRef: OverlayRef;
	private positionStrategy: PositionStrategy;
	private modalSubscription: Subscription;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly i18n: ILocalizationService,
		private readonly allCards: CardsFacadeService,
		private readonly prefs: PreferencesService,
		private readonly bgComps: BattlegroundsCompsService,
		private readonly compStrategies: BgsMetaCompositionStrategiesService,
		private readonly overlay: Overlay,
		private readonly overlayPositionBuilder: OverlayPositionBuilder,
	) {
		super(cdr);
		this.setupModal();
	}

	trackByFn(index: number, stat: BgsMetaCompStatTier) {
		return stat.id;
	}
	trackByFnItem(index: number, stat: BgsMetaCompStatTierItem) {
		return stat.compId;
	}

	async ngAfterContentInit() {
		await waitForReady(this.bgComps, this.prefs, this.compStrategies);

		this.loading$ = this.loading$$.pipe(this.mapData((loading) => loading));
		this.sortCriteria$ = this.sortCriteria$$.pipe(this.mapData((criteria) => criteria));
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
		const stats$ = combineLatest([
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
		this.tiers$ = combineLatest([stats$, this.sortCriteria$$]).pipe(
			filter(([stats, sortCriteria]) => !!stats?.length),
			this.mapData(([stats, sortCriteria]) => {
				const filtered = stats;
				const tiers = buildCompTiers(filtered, sortCriteria, this.i18n);
				const result = tiers;
				return result;
			}),
			tap(() => this.loading$$.next(false)),
			takeUntil(this.destroyed$),
		);
		this.totalGames$ = stats$.pipe(
			filter((stats) => !!stats),
			this.mapData(
				(stats) =>
					stats!
						.map((s) => s.dataPoints)
						.reduce((a, b) => a + b, 0)
						.toLocaleString(this.i18n.formatCurrentLocale() ?? 'enUS') ?? '-',
			),
		);
		const lastUpdate$: Observable<string | null> = baseStats$.pipe(
			this.mapData((stats) => (stats ? '' + stats.lastUpdateDate : null)),
		);
		this.lastUpdate$ = lastUpdate$.pipe(
			filter((date): date is string => !!date),
			this.mapData((dateStr: string) => {
				// Show the date as a relative date, unless it's more than 1 week old
				// E.g. "2 hours ago", "3 days ago", "1 week ago", "on 12/12/2020"
				const date = new Date(dateStr);
				const now = new Date();
				const diff = now.getTime() - date.getTime();
				const days = diff / (1000 * 3600 * 24);
				if (days < 7) {
					return getDateAgo(date, this.i18n);
				}
				return date.toLocaleDateString(this.i18n.formatCurrentLocale() ?? 'enUS');
			}),
		);
		this.lastUpdateFull$ = lastUpdate$.pipe(
			filter((date): date is string => !!date),
			this.mapData((dateStr) => {
				const date = new Date(dateStr!);
				return date.toLocaleDateString(this.i18n.formatCurrentLocale() ?? 'enUS', {
					year: 'numeric',
					month: 'numeric',
					day: 'numeric',
					hour: 'numeric',
					minute: 'numeric',
					second: 'numeric',
				});
			}),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	override ngOnDestroy(): void {
		super.ngOnDestroy();
		if (this.modalSubscription) {
			this.modalSubscription.unsubscribe();
		}
		if (this.overlayRef) {
			this.overlayRef.dispose();
		}
	}

	onCompositionClick(composition: BgsMetaCompStatTierItem) {
		this.showCompositionModal(composition);
	}

	onSortClick(rawCriteria: string) {
		const criteria: ColumnSortTypeComp = rawCriteria as ColumnSortTypeComp;
		this.sortCriteria$$.next({
			criteria: criteria,
			direction:
				criteria === this.sortCriteria$$.value?.criteria
					? invertDirection(this.sortCriteria$$.value.direction)
					: getDefaultDirection(criteria),
		});
	}

	toggleHeader() {
		this.headerCollapsed = !this.headerCollapsed;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private setupModal() {
		this.positionStrategy = this.overlayPositionBuilder.global().centerHorizontally().centerVertically();
		this.overlayRef = this.overlay.create({
			positionStrategy: this.positionStrategy,
			hasBackdrop: true,
			backdropClass: 'composition-modal-backdrop',
		});

		this.modalSubscription = this.overlayRef.backdropClick().subscribe(() => {
			this.closeModal();
		});
	}

	private showCompositionModal(composition: BgsMetaCompStatTierItem) {
		const portal = new ComponentPortal(BattlegroundsCompositionDetailsModalComponent);
		const modalRef: ComponentRef<BattlegroundsCompositionDetailsModalComponent> = this.overlayRef.attach(portal);

		// Find matching composition advice
		const compositionAdvice =
			this.compStrategies.strategies$$?.value?.find((advice) => advice.compId === composition.compId) || null;

		modalRef.instance.composition = composition;
		modalRef.instance.compositionAdvice = compositionAdvice;
		modalRef.instance.closeHandler = () => {
			this.closeModal();
		};

		this.positionStrategy.apply();
	}

	private closeModal() {
		this.overlayRef.detach();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}

const getDefaultDirection = (criteria: ColumnSortTypeComp): 'asc' | 'desc' => {
	switch (criteria) {
		case 'position':
			return 'asc';
		default:
			return 'desc';
	}
};
