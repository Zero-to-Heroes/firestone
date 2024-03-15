/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { CardClass, CardIds, allDuelsTreasureCardIds } from '@firestone-hs/reference-data';
import {
	ArenaCardClassFilterType,
	ArenaCardTypeFilterType,
	PreferencesService,
} from '@firestone/shared/common/service';
import { SortCriteria, SortDirection, invertDirection } from '@firestone/shared/common/view';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { CardsFacadeService, ILocalizationService, getDateAgo } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, combineLatest, filter, shareReplay, startWith, takeUntil, tap } from 'rxjs';
import { ArenaCombinedCardStat } from '../../models/arena-combined-card-stat';
import { ARENA_DRAFT_CARD_HIGH_WINS_THRESHOLD, ArenaCardStatsService } from '../../services/arena-card-stats.service';
import { ArenaClassStatsService } from '../../services/arena-class-stats.service';
import { ArenaCardStatInfo } from './model';

@Component({
	selector: 'arena-card-stats',
	styleUrls: [`./arena-card-stats-columns.scss`, `./arena-card-stats.component.scss`],
	template: `
		<with-loading [isLoading]="loading$ | async">
			<section
				class="arena-card-stats"
				[attr.aria-label]="'Arena card stats'"
				*ngIf="{ cards: cards$ | async } as value"
			>
				<div class="data-info">
					<div class="label" [fsTranslate]="'app.decktracker.meta.last-updated'"></div>
					<div class="value" [helpTooltip]="lastUpdateFull$ | async">{{ lastUpdate$ | async }}</div>
					<div class="separator">-</div>
					<div class="label" [fsTranslate]="'app.decktracker.meta.total-games'"></div>
					<div class="value">{{ totalGames$ | async }}</div>
					<div class="separator">-</div>
					<div class="label" [fsTranslate]="'app.arena.card-stats.total-cards-drafted'"></div>
					<div class="value">{{ totalCardsDrafted$ | async }}</div>
				</div>
				<div class="header" *ngIf="sortCriteria$ | async as sort">
					<sortable-table-label
						class="cell card-details"
						[name]="'app.arena.card-stats.header-card-name' | fsTranslate"
						[sort]="sort"
						[criteria]="'name'"
						(sortClick)="onSortClick($event)"
					>
					</sortable-table-label>
					<sortable-table-label
						class="cell drawn-winrate"
						[name]="'app.arena.card-stats.header-drawn-winrate' | fsTranslate"
						[helpTooltip]="'app.arena.card-stats.header-drawn-winrate-tooltip' | fsTranslate"
						[sort]="sort"
						[criteria]="'drawn-winrate'"
						(sortClick)="onSortClick($event)"
					>
					</sortable-table-label>
					<sortable-table-label
						class="cell deck-winrate"
						[name]="'app.arena.card-stats.header-deck-winrate' | fsTranslate"
						[helpTooltip]="'app.arena.card-stats.header-deck-winrate-tooltip' | fsTranslate"
						[sort]="sort"
						[criteria]="'deck-winrate'"
						(sortClick)="onSortClick($event)"
					>
					</sortable-table-label>
					<sortable-table-label
						class="cell pickrate"
						[name]="'app.arena.card-stats.header-pickrate' | fsTranslate"
						[helpTooltip]="'app.arena.card-stats.header-pickrate-tooltip' | fsTranslate"
						[sort]="sort"
						[criteria]="'pickrate'"
						(sortClick)="onSortClick($event)"
					>
					</sortable-table-label>
					<sortable-table-label
						class="cell pickrate-high-wins"
						[name]="headerPickrateHighWins"
						[helpTooltip]="headerPickrateHighWinsTooltip"
						[sort]="sort"
						[criteria]="'pickrate-high-wins'"
						(sortClick)="onSortClick($event)"
					>
					</sortable-table-label>
					<sortable-table-label
						class="cell drawn-total"
						[name]="'app.arena.card-stats.header-drawn-total' | fsTranslate"
						[sort]="sort"
						[criteria]="'drawn-total'"
						(sortClick)="onSortClick($event)"
					>
					</sortable-table-label>
					<sortable-table-label
						class="cell deck-total"
						[name]="'app.arena.card-stats.header-deck-total' | fsTranslate"
						[sort]="sort"
						[criteria]="'deck-total'"
						(sortClick)="onSortClick($event)"
					>
					</sortable-table-label>
					<sortable-table-label
						class="cell offered-total"
						[name]="'app.arena.card-stats.header-offered-total' | fsTranslate"
						[sort]="sort"
						[criteria]="'offered-total'"
						(sortClick)="onSortClick($event)"
					>
					</sortable-table-label>
					<sortable-table-label
						class="cell pickrate-impact"
						[name]="'app.arena.card-stats.header-pickrate-impact' | fsTranslate"
						[helpTooltip]="headerPickrateSkillTooltip"
						[sort]="sort"
						[criteria]="'pickrate-impact'"
						(sortClick)="onSortClick($event)"
					>
					</sortable-table-label>
					<!-- <sortable-table-label
						class="cell offered-total-high-wins"
						[name]="'app.arena.card-stats.header-offered-total-high-wins' | fsTranslate"
						[sort]="sort"
						[criteria]="'offered-high-wins'"
						(sortClick)="onSortClick($event)"
					>
					</sortable-table-label> -->
				</div>
				<virtual-scroller
					#scroll
					[items]="value.cards!"
					[bufferAmount]="25"
					role="list"
					class="cards-list"
					scrollable
				>
					<arena-card-stat-item
						*ngFor="let card of scroll.viewPortItems; trackBy: trackByFn"
						class="card-info"
						role="listitem"
						[card]="card"
					></arena-card-stat-item>
				</virtual-scroller>
			</section>
		</with-loading>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaCardStatsComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	loading$: Observable<boolean>;
	cards$: Observable<ArenaCardStatInfo[]>;
	sortCriteria$: Observable<SortCriteria<ColumnSortType>>;
	lastUpdate$: Observable<string | null>;
	lastUpdateFull$: Observable<string | null>;
	totalGames$: Observable<string>;
	totalCardsDrafted$: Observable<string>;

	headerPickrateHighWins: string = this.i18n.translateString('app.arena.card-stats.header-pickrate-high-wins', {
		value: ARENA_DRAFT_CARD_HIGH_WINS_THRESHOLD,
	})!;
	headerPickrateHighWinsTooltip: string = this.i18n.translateString(
		'app.arena.card-stats.header-pickrate-high-wins-tooltip',
		{ value: ARENA_DRAFT_CARD_HIGH_WINS_THRESHOLD },
	)!;
	headerPickrateSkillTooltip: string = this.i18n.translateString(
		'app.arena.card-stats.header-pickrate-impact-tooltip',
		{
			value: ARENA_DRAFT_CARD_HIGH_WINS_THRESHOLD,
		},
	)!;

	private sortCriteria$$ = new BehaviorSubject<SortCriteria<ColumnSortType>>({
		criteria: 'drawn-winrate',
		direction: 'desc',
	});

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly arenaCardStats: ArenaCardStatsService,
		private readonly arenaClassStats: ArenaClassStatsService,
		private readonly i18n: ILocalizationService,
		private readonly allCards: CardsFacadeService,
		private readonly prefs: PreferencesService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await this.arenaCardStats.isReady();
		await this.arenaClassStats.isReady();
		await this.prefs.isReady();

		console.debug('[arena-card-stats] after content init');
		this.sortCriteria$ = this.sortCriteria$$;
		this.cards$ = combineLatest([
			this.arenaCardStats.cardStats$$,
			this.arenaCardStats.searchString$$,
			this.sortCriteria$$,
			this.prefs.preferences$(
				(prefs) => prefs.arenaActiveCardTypeFilter,
				(prefs) => prefs.arenaActiveCardClassFilter,
			),
		]).pipe(
			tap((info) => console.debug('[arena-card-stats] received info', info)),
			this.mapData(([stats, searchString, sortCriteria, [cardType, cardClass]]) =>
				this.buildCardStats(stats?.stats, cardType, cardClass, searchString, sortCriteria),
			),
			tap((info) => console.debug('[arena-card-stats] built card stats', info)),
			shareReplay(1),
			this.mapData((stats) => stats),
		);
		this.loading$ = this.cards$.pipe(
			startWith(true),
			tap((info) => console.debug('[arena-card-stats]] received info 2', info)),
			this.mapData((tiers) => tiers === null),
		);
		this.totalGames$ = combineLatest([
			this.arenaClassStats.classStats$$,
			this.prefs.preferences$((prefs) => prefs.arenaActiveClassFilter),
		]).pipe(
			filter(([stats]) => !!stats),
			this.mapData(
				([stats, [playerClass]]) =>
					stats?.stats
						?.filter((s) => !playerClass?.length || playerClass === 'all' || s.playerClass === playerClass)
						?.map((s) => s.totalGames)
						?.reduce((a, b) => a + b, 0)
						.toLocaleString(this.i18n.formatCurrentLocale() ?? 'enUS') ?? '-',
			),
			takeUntil(this.destroyed$),
		);
		this.totalCardsDrafted$ = this.arenaCardStats.cardStats$$.pipe(
			filter((stats) => !!stats),
			this.mapData(
				(stats) =>
					stats?.stats
						?.map((s) => s.draftStats?.totalOffered ?? 0)
						?.reduce((a, b) => a + b, 0)
						.toLocaleString(this.i18n.formatCurrentLocale() ?? 'enUS') ?? '-',
			),
			takeUntil(this.destroyed$),
		);
		this.lastUpdate$ = this.arenaClassStats.classStats$$.pipe(
			this.mapData((stats) => {
				if (!stats?.lastUpdated) {
					return null;
				}
				// Show the date as a relative date, unless it's more than 1 week old
				// E.g. "2 hours ago", "3 days ago", "1 week ago", "on 12/12/2020"
				const date = new Date(stats.lastUpdated);
				const now = new Date();
				const diff = now.getTime() - date.getTime();
				const days = diff / (1000 * 3600 * 24);
				if (days < 7) {
					return getDateAgo(date, this.i18n);
				}
				return date.toLocaleDateString(this.i18n.formatCurrentLocale() ?? 'enUS');
			}),
		);
		this.lastUpdateFull$ = this.arenaClassStats.classStats$$.pipe(
			this.mapData((stats) => {
				if (!stats?.lastUpdated) {
					return null;
				}
				const date = new Date(stats.lastUpdated);
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

	trackByFn(index, item: ArenaCardStatInfo) {
		return item.cardId;
	}

	private buildCardStats(
		stats: readonly ArenaCombinedCardStat[] | null | undefined,
		cardType: ArenaCardTypeFilterType | null | undefined,
		cardClass: ArenaCardClassFilterType | null | undefined,
		searchString: string | undefined,
		sortCriteria: SortCriteria<ColumnSortType>,
	): ArenaCardStatInfo[] {
		console.debug(
			'[arena-card-stats] building card stats',
			stats?.filter((s) => s.cardId === 'WW_406'),
			searchString,
			sortCriteria,
		);
		const result =
			stats
				?.filter((stat) => stat.matchStats?.drawn > 100)
				.filter(
					(stat) =>
						!searchString?.length ||
						this.allCards.getCard(stat.cardId)?.name?.toLowerCase().includes(searchString.toLowerCase()),
				)
				.filter((stat) => this.hasCorrectCardClass(stat.cardId, cardClass))
				.filter((stat) => this.hasCorrectCardType(stat.cardId, cardType))
				.map((stat) => this.buildCardStat(stat))
				.sort((a, b) => this.sortCards(a, b, sortCriteria)) ?? [];
		console.debug(
			'[arena-card-stats] built card stats',
			result?.filter((s) => s.cardId === 'WW_406'),
		);
		return result;
		// .sort(sortByProperties((a: ArenaCardStatInfo) => [-(a.drawWinrate ?? 0)])) ?? []
	}

	private hasCorrectCardClass(cardId: string, cardClass: ArenaCardClassFilterType | null | undefined): boolean {
		if (!cardClass || cardClass === 'all') {
			return true;
		}
		const refCard = this.allCards.getCard(cardId);
		if (cardClass === 'no-neutral') {
			return !!refCard?.classes?.length && !refCard.classes.includes(CardClass[CardClass.NEUTRAL]);
		}
		if (cardClass === 'neutral') {
			return !refCard?.classes?.length || refCard.classes.includes(CardClass[CardClass.NEUTRAL]);
		}
		return !!refCard?.classes?.length && refCard.classes.includes(CardClass[cardClass]);
	}

	private hasCorrectCardType(cardId: string, cardType: ArenaCardTypeFilterType | null | undefined): boolean {
		if (!cardType || cardType === 'all') {
			return true;
		}
		if (cardType === 'legendary') {
			return (
				this.allCards.getCard(cardId)?.rarity === 'Legendary' &&
				!allDuelsTreasureCardIds.includes(cardId as CardIds)
			);
		}
		if (cardType === 'treasure') {
			return allDuelsTreasureCardIds.includes(cardId as CardIds);
		}
		if (cardType === 'other') {
			return (
				!allDuelsTreasureCardIds.includes(cardId as CardIds) &&
				this.allCards.getCard(cardId)?.rarity !== 'Legendary'
			);
		}
		return true;
	}

	private buildCardStat(stat: ArenaCombinedCardStat): ArenaCardStatInfo {
		return {
			cardId: stat.cardId,
			drawnTotal: stat.matchStats.drawn,
			drawWinrate: stat.matchStats.drawn > 0 ? stat.matchStats.drawnThenWin / stat.matchStats.drawn : null,
			deckTotal: stat.matchStats.inStartingDeck,
			deckWinrate:
				stat.matchStats.inStartingDeck > 0 ? stat.matchStats.wins / stat.matchStats.inStartingDeck : null,
			totalOffered: stat.draftStats?.totalOffered,
			totalPicked: stat.draftStats?.totalPicked,
			pickRate: stat.draftStats?.pickRate,
			totalOfferedHighWins: stat.draftStats?.totalOfferedHighWins,
			totalPickedHighWins: stat.draftStats?.totalPickedHighWins,
			pickRateHighWins: stat.draftStats?.pickRateHighWins,
			pickRateImpact: stat.draftStats?.pickRateImpact,
		};
	}

	onSortClick(rawCriteria: string) {
		const criteria: ColumnSortType = rawCriteria as ColumnSortType;
		this.sortCriteria$$.next({
			criteria: criteria,
			direction:
				criteria === this.sortCriteria$$.value?.criteria
					? invertDirection(this.sortCriteria$$.value.direction)
					: 'desc',
		});
	}

	private sortCards(a: ArenaCardStatInfo, b: ArenaCardStatInfo, sortCriteria: SortCriteria<ColumnSortType>): number {
		switch (sortCriteria?.criteria) {
			case 'name':
				return this.sortByName(a, b, sortCriteria.direction);
			case 'drawn-winrate':
				return this.sortByDrawnWinrate(a, b, sortCriteria.direction);
			case 'deck-winrate':
				return this.sortByDeckWinrate(a, b, sortCriteria.direction);
			case 'drawn-total':
				return this.sortByDrawnTotal(a, b, sortCriteria.direction);
			case 'deck-total':
				return this.sortByDeckTotal(a, b, sortCriteria.direction);
			case 'offered-total':
				return this.sortByOfferedTotal(a, b, sortCriteria.direction);
			case 'pickrate':
				return this.sortByPickrateTotal(a, b, sortCriteria.direction);
			case 'offered-total-high-wins':
				return this.sortByOfferedTotalHighWins(a, b, sortCriteria.direction);
			case 'pickrate-high-wins':
				return this.sortByPickrateHighWins(a, b, sortCriteria.direction);
			case 'pickrate-impact':
				return this.sortByPickrateImpact(a, b, sortCriteria.direction);
			default:
				return 0;
		}
	}

	private sortByPickrateImpact(a: ArenaCardStatInfo, b: ArenaCardStatInfo, direction: SortDirection): number {
		const aData = a.pickRateImpact ?? 0;
		const bData = b.pickRateImpact ?? 0;
		return direction === 'asc' ? aData - bData : bData - aData;
	}

	private sortByPickrateHighWins(a: ArenaCardStatInfo, b: ArenaCardStatInfo, direction: SortDirection): number {
		const aData = a.pickRateHighWins ?? 0;
		const bData = b.pickRateHighWins ?? 0;
		return direction === 'asc' ? aData - bData : bData - aData;
	}

	private sortByOfferedTotalHighWins(a: ArenaCardStatInfo, b: ArenaCardStatInfo, direction: SortDirection): number {
		const aData = a.totalOfferedHighWins ?? 0;
		const bData = b.totalOfferedHighWins ?? 0;
		return direction === 'asc' ? aData - bData : bData - aData;
	}

	private sortByPickrateTotal(a: ArenaCardStatInfo, b: ArenaCardStatInfo, direction: SortDirection): number {
		const aData = a.pickRate ?? 0;
		const bData = b.pickRate ?? 0;
		return direction === 'asc' ? aData - bData : bData - aData;
	}

	private sortByOfferedTotal(a: ArenaCardStatInfo, b: ArenaCardStatInfo, direction: SortDirection): number {
		const aData = a.totalOffered ?? 0;
		const bData = b.totalOffered ?? 0;
		return direction === 'asc' ? aData - bData : bData - aData;
	}

	private sortByName(a: ArenaCardStatInfo, b: ArenaCardStatInfo, direction: SortDirection): number {
		const aData = this.allCards.getCard(a.cardId)?.name;
		const bData = this.allCards.getCard(b.cardId)?.name;
		return direction === 'asc' ? aData.localeCompare(bData) : bData.localeCompare(aData);
	}

	private sortByDrawnTotal(a: ArenaCardStatInfo, b: ArenaCardStatInfo, direction: SortDirection): number {
		const aData = a.drawnTotal ?? 0;
		const bData = b.drawnTotal ?? 0;
		return direction === 'asc' ? aData - bData : bData - aData;
	}

	private sortByDeckTotal(a: ArenaCardStatInfo, b: ArenaCardStatInfo, direction: SortDirection): number {
		const aData = a.deckTotal ?? 0;
		const bData = b.deckTotal ?? 0;
		return direction === 'asc' ? aData - bData : bData - aData;
	}

	private sortByDrawnWinrate(a: ArenaCardStatInfo, b: ArenaCardStatInfo, direction: SortDirection): number {
		const aData = a.drawWinrate ?? 0;
		const bData = b.drawWinrate ?? 0;
		return direction === 'asc' ? aData - bData : bData - aData;
	}

	private sortByDeckWinrate(a: ArenaCardStatInfo, b: ArenaCardStatInfo, direction: SortDirection): number {
		const aData = a.deckWinrate ?? 0;
		const bData = b.deckWinrate ?? 0;
		return direction === 'asc' ? aData - bData : bData - aData;
	}
}

type ColumnSortType =
	| 'name'
	| 'drawn-total'
	| 'drawn-winrate'
	| 'deck-total'
	| 'deck-winrate'
	| 'pickrate-impact'
	| 'offered-total'
	| 'pickrate'
	| 'pickrate-high-wins'
	| 'offered-total-high-wins';
