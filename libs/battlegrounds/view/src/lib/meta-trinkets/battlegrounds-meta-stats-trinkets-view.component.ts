/* eslint-disable @angular-eslint/template/no-negated-async */
import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { SpellSchool } from '@firestone-hs/reference-data';
import {
	BgsMetaTrinketStatTier,
	BgsMetaTrinketStatTierItem,
	ColumnSortType,
	buildTrinketTiers,
} from '@firestone/battlegrounds/data-access';
import { BgsTrinketActiveTabType } from '@firestone/shared/common/service';
import { SortCriteria } from '@firestone/shared/common/view';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { CardsFacadeService, ILocalizationService, getDateAgo } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, combineLatest, filter, tap } from 'rxjs';

@Component({
	standalone: false,
	selector: 'battlegrounds-meta-stats-trinkets-view',
	styleUrls: [
		`./battlegrounds-meta-stats-trinkets-columns.scss`,
		`./battlegrounds-meta-stats-trinkets-view.component.scss`,
	],
	template: `
		<section class="battlegrounds-meta-stats-trinkets" [attr.aria-label]="'Battlegrounds meta trinket stats'">
			<div class="data-info">
				<div class="label" [fsTranslate]="'app.decktracker.meta.last-updated'"></div>
				<div class="value" [helpTooltip]="lastUpdateFull$ | async">{{ lastUpdate$ | async }}</div>
				<div class="separator">-</div>
				<div class="label" [fsTranslate]="'app.decktracker.meta.total-games'"></div>
				<div class="value">{{ totalGames$ | async }}</div>
			</div>

			<div class="header" *ngIf="sortCriteria$ | async as sort">
				<div class="cell image"></div>
				<div class="cell name" [fsTranslate]="'app.battlegrounds.tier-list.header-trinket-details'"></div>
				<sortable-table-label
					class="cell average-placement"
					[name]="'app.battlegrounds.tier-list.header-average-position' | fsTranslate"
					[sort]="sort"
					[criteria]="'average-position'"
					(sortClick)="onSortClick($event)"
				>
				</sortable-table-label>
				<sortable-table-label
					class="cell average-placement-high-mmr"
					[name]="averagePlacementHighMmrLabel"
					[helpTooltip]="averagePlacementHighMmrLabelTooltip"
					[sort]="sort"
					[criteria]="'average-position-high-mmr'"
					(sortClick)="onSortClick($event)"
				>
				</sortable-table-label>
				<sortable-table-label
					class="cell pick-rate"
					[name]="'app.battlegrounds.tier-list.header-pick-rate' | fsTranslate"
					[sort]="sort"
					[criteria]="'pick-rate'"
					(sortClick)="onSortClick($event)"
				>
				</sortable-table-label>
				<sortable-table-label
					class="cellpick-rate-high-mmr"
					[name]="pickRateHighMmrLabel"
					[helpTooltip]="pickRateHighMmrLabelTooltip"
					[sort]="sort"
					[criteria]="'pick-rate-high-mmr'"
					(sortClick)="onSortClick($event)"
				>
				</sortable-table-label>

				<div class="button-groups">
					<fs-text-input
						class="search"
						[placeholder]="'app.battlegrounds.tier-list.trinket-search-placeholder' | fsTranslate"
						[debounceTime]="100"
						(fsModelUpdate)="onSearchStringUpdated($event)"
					>
					</fs-text-input>
				</div>
			</div>
			<div class="trinkets-list" role="list" scrollable>
				<ng-container *ngIf="sortCriteria$ | async as sort">
					<ng-container
						*ngIf="sort.criteria === 'average-position' || sort.criteria === 'average-position-high-mmr'"
					>
						<battlegrounds-meta-stats-trinket-tier
							*ngFor="let tier of tiers$ | async; trackBy: trackByFn"
							role="listitem"
							[tier]="tier"
						></battlegrounds-meta-stats-trinket-tier>
					</ng-container>
					<ng-container
						*ngIf="sort.criteria !== 'average-position' && sort.criteria !== 'average-position-high-mmr'"
					>
						<ng-container *ngFor="let tier of tiers$ | async">
							<battlegrounds-meta-stats-trinket-info
								class="item-info"
								*ngFor="let stat of tier.items; trackBy: trackByFnItem"
								role="listitem"
								[stat]="stat"
							></battlegrounds-meta-stats-trinket-info>
						</ng-container>
					</ng-container>
				</ng-container>
			</div>
		</section>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsMetaStatsTrinketsViewComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit
{
	tiers$: Observable<readonly BgsMetaTrinketStatTier[]>;

	lastUpdate$: Observable<string | null>;
	lastUpdateFull$: Observable<string | null>;
	totalGames$: Observable<string>;

	searchString$: Observable<string>;
	sortCriteria$: Observable<SortCriteria<ColumnSortType>>;

	averagePlacementHighMmrLabel = this.i18n.translateString(
		'app.battlegrounds.tier-list.header-average-position-high-mmr',
		{
			value: 25,
		},
	);
	averagePlacementHighMmrLabelTooltip = this.i18n.translateString(
		'app.battlegrounds.tier-list.header-average-position-high-mmr-tooltip',
		{
			value: 25,
		},
	);
	pickRateHighMmrLabel = this.i18n.translateString('app.battlegrounds.tier-list.header-pick-rate-high-mmr', {
		value: 25,
	});
	pickRateHighMmrLabelTooltip = this.i18n.translateString(
		'app.battlegrounds.tier-list.header-pick-rate-high-mmr-tooltip',
		{
			value: 25,
		},
	);

	private sortCriteria$$ = new BehaviorSubject<SortCriteria<ColumnSortType>>({
		criteria: 'average-position',
		direction: 'asc',
	});

	@Input() set stats(value: readonly BgsMetaTrinketStatTierItem[] | null) {
		this.stats$$.next(value);
	}
	@Input() set lastUpdate(value: string | null) {
		this.lastUpdate$$.next(value);
	}
	@Input() set trinketType(value: BgsTrinketActiveTabType | null) {
		this.trinketType$$.next(value);
	}

	private stats$$ = new BehaviorSubject<readonly BgsMetaTrinketStatTierItem[]>(null);
	private lastUpdate$$ = new BehaviorSubject<string | null>(null);
	private trinketType$$ = new BehaviorSubject<BgsTrinketActiveTabType>(null);
	private searchString$$ = new BehaviorSubject<string>(null);

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly i18n: ILocalizationService,
		private readonly allCards: CardsFacadeService,
	) {
		super(cdr);
	}

	trackByFn(index: number, stat: BgsMetaTrinketStatTier) {
		return stat.id;
	}
	trackByFnItem(index: number, stat: BgsMetaTrinketStatTierItem) {
		return stat.cardId;
	}

	ngAfterContentInit() {
		this.searchString$ = this.searchString$$.asObservable();
		this.sortCriteria$ = this.sortCriteria$$.asObservable();
		this.tiers$ = combineLatest([this.stats$$, this.trinketType$$, this.searchString$$, this.sortCriteria$$]).pipe(
			tap((info) => console.debug('received info for trinkets', info)),
			filter(([stats, trinketType, searchString, sortCriteria]) => !!stats),
			this.mapData(([stats, trinketType, searchString, sortCriteria]) => {
				const filtered = stats.filter((s) =>
					trinketType === 'lesser'
						? this.allCards.getCard(s.cardId).spellSchool === SpellSchool[SpellSchool.LESSER_TRINKET]
						: this.allCards.getCard(s.cardId).spellSchool === SpellSchool[SpellSchool.GREATER_TRINKET],
				);
				const tiers = buildTrinketTiers(filtered, sortCriteria, this.i18n);
				const result = !!searchString?.length
					? tiers
							.map((t) => {
								return {
									...t,
									items: t.items.filter((i) =>
										i.name.toLowerCase().includes(searchString.toLowerCase()),
									),
								};
							})
							.filter((t) => t.items.length > 0)
					: tiers;
				return result;
			}),
		);
		this.totalGames$ = this.tiers$.pipe(
			filter((stats) => !!stats),
			this.mapData(
				(stats) =>
					Math.max(...(stats?.flatMap((s) => s.items)?.map((i) => i.dataPoints) ?? [])).toLocaleString(
						this.i18n.formatCurrentLocale() ?? 'enUS',
					) ?? '-',
			),
		);
		this.lastUpdate$ = this.lastUpdate$$.pipe(
			filter((date) => !!date),
			this.mapData((dateStr) => {
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
		this.lastUpdateFull$ = this.lastUpdate$$.pipe(
			filter((date) => !!date),
			this.mapData((dateStr) => {
				const date = new Date(dateStr);
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
	}

	onSearchStringUpdated(value: string) {
		this.searchString$$.next(value);
	}

	onSortClick(rawCriteria: string) {
		const criteria: ColumnSortType = rawCriteria as ColumnSortType;
		// No point in sorting by the "worse hero" first, at least until I've got asks for it
		if (criteria === this.sortCriteria$$.value?.criteria) {
			return;
		}

		this.sortCriteria$$.next({
			criteria: criteria,
			direction: getDefaultDirection(criteria),
		});
	}
}

const getDefaultDirection = (criteria: ColumnSortType): 'asc' | 'desc' => {
	switch (criteria) {
		case 'average-position':
		case 'average-position-high-mmr':
			return 'asc';
		case 'pick-rate':
		case 'pick-rate-high-mmr':
		default:
			return 'desc';
	}
};
