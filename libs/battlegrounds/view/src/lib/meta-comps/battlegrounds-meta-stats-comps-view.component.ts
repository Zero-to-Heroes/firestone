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
	Input,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { BgsCompAdvice } from '@firestone-hs/content-craetor-input';
import { SortCriteria, invertDirection } from '@firestone/shared/common/view';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import {
	AnalyticsService,
	CardsFacadeService,
	ILocalizationService,
	getDateAgo,
} from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, Subscription, combineLatest, filter, takeUntil, tap } from 'rxjs';
import { BattlegroundsCompositionDetailsModalComponent } from './battlegrounds-composition-details-modal.component';
import { buildCompTiers } from './bgs-meta-comp-stats';
import { BgsMetaCompStatTier, BgsMetaCompStatTierItem, ColumnSortTypeComp } from './meta-comp.model';

@Component({
	standalone: false,
	selector: 'battlegrounds-meta-stats-comps-view',
	styleUrls: [
		`./battlegrounds-meta-stats-comps-columns.scss`,
		`./battlegrounds-meta-stats-comps-view.component.scss`,
	],
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
export class BattlegroundsMetaStatsCompsViewComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit, OnDestroy
{
	tiers$: Observable<readonly BgsMetaCompStatTier[]>;
	loading$: Observable<boolean>;
	lastUpdate$: Observable<string | null>;
	lastUpdateFull$: Observable<string | null>;
	totalGames$: Observable<string>;
	sortCriteria$: Observable<SortCriteria<ColumnSortTypeComp>>;

	@Input() set stats(value: readonly BgsMetaCompStatTierItem[] | null) {
		this.stats$$.next(value);
	}
	@Input() set loading(value: boolean | null) {
		this.loading$$.next(value);
	}
	@Input() set lastUpdate(value: Date | null) {
		this.lastUpdate$$.next(value);
	}
	@Input() strategies: readonly BgsCompAdvice[] | null;

	private sortCriteria$$ = new BehaviorSubject<SortCriteria<ColumnSortTypeComp>>({
		criteria: 'first',
		direction: 'desc',
	});
	private loading$$ = new BehaviorSubject<boolean | null>(true);
	private stats$$ = new BehaviorSubject<readonly BgsMetaCompStatTierItem[] | null>(null);
	private lastUpdate$$ = new BehaviorSubject<Date | null>(null);

	private overlayRef: OverlayRef;
	private positionStrategy: PositionStrategy;
	private modalSubscription: Subscription;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly i18n: ILocalizationService,
		private readonly allCards: CardsFacadeService,
		private readonly overlay: Overlay,
		private readonly overlayPositionBuilder: OverlayPositionBuilder,
		private readonly analytics: AnalyticsService,
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
		this.loading$ = this.loading$$.pipe(this.mapData((loading) => !!loading));
		this.sortCriteria$ = this.sortCriteria$$.pipe(this.mapData((criteria) => criteria));
		this.tiers$ = combineLatest([this.stats$$, this.sortCriteria$$]).pipe(
			filter(([stats, sortCriteria]) => !!stats?.length),
			this.mapData(([stats, sortCriteria]) => {
				const filtered = stats;
				const tiers = buildCompTiers(filtered!, sortCriteria, this.i18n);
				const result = tiers;
				return result;
			}),
			tap(() => this.loading$$.next(false)),
			takeUntil(this.destroyed$),
		);
		this.totalGames$ = this.stats$$.pipe(
			filter((stats) => !!stats),
			this.mapData(
				(stats) =>
					stats!
						.map((s) => s.dataPoints)
						.reduce((a, b) => a + b, 0)
						.toLocaleString(this.i18n.formatCurrentLocale() ?? 'enUS') ?? '-',
			),
		);
		this.lastUpdate$ = this.lastUpdate$$.pipe(
			filter((date) => !!date),
			this.mapData((date) => {
				const now = new Date();
				const diff = now.getTime() - date.getTime();
				const days = diff / (1000 * 3600 * 24);
				if (days < 7) {
					return getDateAgo(date, this.i18n);
				}
				return date.toLocaleDateString(this.i18n.formatCurrentLocale());
			}),
		);
		this.lastUpdateFull$ = this.lastUpdate$$.pipe(
			filter((date) => !!date),
			this.mapData((date) => {
				return date.toLocaleDateString(this.i18n.formatCurrentLocale(), {
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
		// Update URL to make it shareable
		this.updateUrlForComposition(composition);
		this.showCompositionModal(composition);
	}

	private updateUrlForComposition(composition: BgsMetaCompStatTierItem) {
		const slug = this.createSlug(composition.name);
		const newUrl = `/battlegrounds/comps/${slug}`;
		window.history.pushState({}, '', newUrl);
		// Track page view for composition clicks since pushState doesn't trigger router events
		this.analytics.trackPageView(newUrl);
	}

	private createSlug(text: string): string {
		if (!text) return '';

		return (
			text
				.toLowerCase()
				.trim()
				// Replace spaces and special characters with hyphens
				.replace(/[\s\W-]+/g, '-')
				// Remove leading/trailing hyphens
				.replace(/^-+|-+$/g, '')
				// Replace multiple consecutive hyphens with single hyphen
				.replace(/-+/g, '-')
		);
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
		const compositionAdvice = this.strategies?.find((advice) => advice.compId === composition.compId) || null;

		modalRef.instance.composition = composition;
		modalRef.instance.compositionAdvice = compositionAdvice;
		modalRef.instance.closeHandler = () => {
			this.closeModal();
		};

		this.positionStrategy.apply();
	}

	private updateUrlOnModalClose() {
		// Check if we're currently on a composition-specific URL
		const currentUrl = window.location.pathname;
		if (currentUrl.includes('/battlegrounds/comps/') && currentUrl !== '/battlegrounds/comps') {
			// Navigate back to the compositions list without the specific composition
			const newUrl = '/battlegrounds/comps';
			window.history.replaceState({}, '', newUrl);
			// Track page view when returning to compositions list
			this.analytics.trackPageView(newUrl);
		}
	}

	private closeModal() {
		this.overlayRef.detach();
		this.updateUrlOnModalClose();
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
