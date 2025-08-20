/* eslint-disable @angular-eslint/template/eqeqeq */
import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	Output,
} from '@angular/core';
import { BgsMetaHeroStatTier, BgsMetaHeroStatTierItem, buildTiers } from '@firestone/battlegrounds/data-access';
import { SortCriteria, SortDirection, invertDirection } from '@firestone/shared/common/view';
import { AbstractSubscriptionComponent, sortByProperties } from '@firestone/shared/framework/common';
import { ILocalizationService, getDateAgo } from '@firestone/shared/framework/core';
import {
	BehaviorSubject,
	Observable,
	combineLatest,
	distinctUntilChanged,
	filter,
	map,
	shareReplay,
	takeUntil,
} from 'rxjs';
import { BgsHeroSortFilterType } from './bgs-hero-sort-filter.type';

@Component({
	standalone: false,
	selector: 'battlegrounds-meta-stats-heroes-view',
	styleUrls: [
		`./battlegrounds-meta-stats-hero-columns.scss`,
		`./battlegrounds-meta-stats-heroes-view.component.scss`,
	],
	template: `
		<with-loading [isLoading]="(tiers$ | async) == null">
			<section
				class="battlegrounds-meta-stats-heroes"
				[attr.aria-label]="'Battlegrounds meta hero stats'"
				*ngIf="{ tiers: tiers$ | async } as value"
			>
				<div class="top">
					<div class="search">
						<battlegrounds-hero-search
							[searchString]="searchString$ | async"
							(searchStringChange)="searchStringChange.next($event)"
						></battlegrounds-hero-search>
					</div>
					<div class="data-info">
						<div class="label" [fsTranslate]="'app.decktracker.meta.last-updated'"></div>
						<div class="value" [helpTooltip]="lastUpdateFull$ | async">{{ lastUpdate$ | async }}</div>
						<div class="separator">-</div>
						<div class="label" [fsTranslate]="'app.decktracker.meta.total-games'"></div>
						<div class="value">{{ totalGames$ | async }}</div>
					</div>
				</div>
				<div class="header" *ngIf="sortCriteria$ | async as sort">
					<div class="portrait"></div>
					<div class="hero-details" [fsTranslate]="'app.battlegrounds.tier-list.header-hero-details'"></div>

					<sortable-table-label
						class="cell position"
						[name]="'app.battlegrounds.tier-list.header-average-position' | fsTranslate"
						[sort]="sort"
						[criteria]="'average-position'"
						(sortClick)="onSortClick($event)"
					>
					</sortable-table-label>
					<sortable-table-label
						class="cell pickrate"
						[name]="'app.battlegrounds.tier-list.header-pickrate' | fsTranslate"
						[sort]="sort"
						[criteria]="'pick-rate'"
						(sortClick)="onSortClick($event)"
					>
					</sortable-table-label>
					<div
						class="placement"
						[fsTranslate]="'app.battlegrounds.tier-list.header-placement-distribution'"
					></div>
					<div
						class="tribes"
						[fsTranslate]="'app.battlegrounds.tier-list.header-tribes'"
						[helpTooltip]="'app.battlegrounds.tier-list.header-tribes-tooltip' | fsTranslate"
					></div>
					<sortable-table-label
						class="cell net-mmr"
						[name]="'app.battlegrounds.tier-list.header-net-mmr' | fsTranslate"
						[helpTooltip]="'app.battlegrounds.personal-stats.hero.net-mmr-tooltip' | fsTranslate"
						[sort]="sort"
						[criteria]="'mmr'"
						(sortClick)="onSortClick($event)"
					>
					</sortable-table-label>
					<sortable-table-label
						class="cell player-games-played"
						[name]="'app.battlegrounds.tier-list.header-games-played' | fsTranslate"
						[helpTooltip]="'app.battlegrounds.tier-list.header-games-played-tooltip' | fsTranslate"
						[sort]="sort"
						[criteria]="'games-played'"
						(sortClick)="onSortClick($event)"
					>
					</sortable-table-label>
					<!-- <div class="winrate" [owTranslate]="'app.battlegrounds.tier-list.header-combat-winrate'"></div> -->
				</div>
				<div class="heroes-list" role="list" scrollable>
					<battlegrounds-meta-stats-hero-tier
						*ngFor="let tier of value.tiers; trackBy: trackByFn"
						role="listitem"
						[tier]="tier"
						[positionTooltipHidden]="positionTooltipHidden"
						(heroStatClick)="onHeroStatsClick($event)"
					></battlegrounds-meta-stats-hero-tier>
					<a
						class="more-info"
						href="https://github.com/Zero-to-Heroes/firestone/wiki/Battlegrounds-Meta-Stats-for-Heroes"
						target="_blank"
						[fsTranslate]="'app.battlegrounds.tier-list.learn-more'"
					></a>
				</div>
			</section>
		</with-loading>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsMetaStatsHeroesViewComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit
{
	tiers$: Observable<readonly BgsMetaHeroStatTier[]>;
	lastUpdate$: Observable<string>;
	lastUpdateFull$: Observable<string>;
	totalGames$: Observable<string>;
	searchString$: Observable<string>;
	sortCriteria$: Observable<SortCriteria<BgsHeroSortFilterType>>;

	@Output() heroStatClick = new EventEmitter<string>();
	@Output() searchStringChange = new EventEmitter<string>();

	@Input() set stats(value: readonly BgsMetaHeroStatTierItem[]) {
		this.stats$$.next(value);
	}
	@Input() set searchString(value: string) {
		this.searchString$$.next(value);
	}
	@Input() set totalGames(value: number) {
		this.totalGames$$.next(value);
	}
	@Input() set lastUpdate(value: Date) {
		this.lastUpdate$$.next(value);
	}
	@Input() positionTooltipHidden = false;

	private stats$$ = new BehaviorSubject<readonly BgsMetaHeroStatTierItem[]>(null);
	private searchString$$ = new BehaviorSubject<string | null>(null);
	private totalGames$$ = new BehaviorSubject<number>(null);
	private lastUpdate$$ = new BehaviorSubject<Date>(null);

	private sortCriteria$$ = new BehaviorSubject<SortCriteria<BgsHeroSortFilterType>>({
		criteria: 'average-position',
		direction: 'asc',
	});

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly i18n: ILocalizationService,
	) {
		super(cdr);
	}

	ngAfterContentInit() {
		this.sortCriteria$ = this.sortCriteria$$.pipe(
			distinctUntilChanged((a, b) => a.criteria === b.criteria && a.direction === b.direction),
			shareReplay(1),
			takeUntil(this.destroyed$),
		);
		const tiers$ = combineLatest([this.stats$$, this.sortCriteria$]).pipe(
			map(([stats, sortCriteria]) => {
				if (!stats) {
					return null;
				}

				switch (sortCriteria.criteria) {
					// Make sure we keep the items without data at the end
					// return this.buildMonoTier(
					// 	[...stats].sort(
					// 		sortByProperties((s) => [
					// 			s.playerAveragePosition ?? 9 * (sortCriteria.direction === 'asc' ? 1 : -1),
					// 		]),
					// 	),
					// );
					case 'pick-rate':
						// Make sure we keep the items without data at the end
						return this.buildMonoTier(
							[...stats].sort(
								sortByProperties((s) => [
									(s.pickrate ?? 0) * (sortCriteria.direction === 'asc' ? 1 : -1),
								]),
							),
						);
					case 'games-played':
						return this.buildMonoTier(
							[...stats].sort(
								sortByProperties((s) => [
									s.playerDataPoints * (sortCriteria.direction === 'asc' ? 1 : -1),
								]),
							),
						);
					case 'mmr':
						return this.buildMonoTier(
							[...stats].sort(
								sortByProperties((s) => [
									(s.playerNetMmr ?? -10000) * (sortCriteria.direction === 'asc' ? 1 : -1),
								]),
							),
						);
					case 'last-played':
						return this.buildMonoTier(
							[...stats].sort(
								sortByProperties((s) => [
									s.playerLastPlayedTimestamp * (sortCriteria.direction === 'asc' ? 1 : -1),
								]),
							),
						);
					case 'tier':
					case 'average-position':
					default:
						return buildTiers(stats, this.i18n);
				}
			}),
			shareReplay(1),
			takeUntil(this.destroyed$),
		);
		this.tiers$ = combineLatest([tiers$, this.searchString$$]).pipe(
			map(([tiers, searchString]) => {
				return tiers
					?.map((tier) => {
						const result: BgsMetaHeroStatTier = {
							...tier,
							items: tier.items.filter((item) => {
								if (!searchString) {
									return true;
								}
								return item.name.toLowerCase().includes(searchString.toLowerCase());
							}),
						};
						return result;
					})
					.filter((t) => t.items.length > 0);
			}),
			shareReplay(1),
			takeUntil(this.destroyed$),
		);

		this.totalGames$ = this.totalGames$$.pipe(
			filter((totalGames) => totalGames != null),
			map((totalGames) => totalGames.toLocaleString(this.i18n.formatCurrentLocale())),
			takeUntil(this.destroyed$),
		);
		this.lastUpdate$ = this.lastUpdate$$.pipe(
			filter((date) => !!date),
			map((date) => {
				const now = new Date();
				const diff = now.getTime() - date.getTime();
				const days = diff / (1000 * 3600 * 24);
				if (days < 7) {
					return getDateAgo(date, this.i18n);
				}
				return date.toLocaleDateString(this.i18n.formatCurrentLocale());
			}),
			takeUntil(this.destroyed$),
		);
		this.lastUpdateFull$ = this.lastUpdate$$.pipe(
			filter((date) => !!date),
			map((date) => {
				return date.toLocaleDateString(this.i18n.formatCurrentLocale(), {
					year: 'numeric',
					month: 'numeric',
					day: 'numeric',
					hour: 'numeric',
					minute: 'numeric',
					second: 'numeric',
				});
			}),
			takeUntil(this.destroyed$),
		);
	}

	trackByFn(index: number, stat: BgsMetaHeroStatTier) {
		return stat.label;
	}

	onHeroStatsClick(heroCardId: string) {
		if (this.heroStatClick) {
			this.heroStatClick.next(heroCardId);
		}
	}

	onSortClick(rawCriteria: string) {
		if (rawCriteria === 'average-position' && this.sortCriteria$$.value?.criteria === 'average-position') {
			return;
		}

		const criteria: BgsHeroSortFilterType = rawCriteria as BgsHeroSortFilterType;
		this.sortCriteria$$.next({
			criteria: criteria,
			direction:
				criteria === this.sortCriteria$$.value?.criteria
					? invertDirection(this.sortCriteria$$.value.direction)
					: this.getDefaultSortDirection(criteria),
		});
	}

	private getDefaultSortDirection(criteria: BgsHeroSortFilterType): SortDirection {
		return criteria === 'average-position' ? 'asc' : 'desc';
	}

	private buildMonoTier(items: BgsMetaHeroStatTierItem[]): readonly BgsMetaHeroStatTier[] {
		return [
			{
				id: null,
				label: null,
				tooltip: null,
				items: items,
			},
		];
	}
}
