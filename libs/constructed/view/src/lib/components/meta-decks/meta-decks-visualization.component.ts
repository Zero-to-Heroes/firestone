import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	Output,
	ViewRef,
} from '@angular/core';
import { DeckStat } from '@firestone-hs/constructed-deck-stats';
import { decode } from '@firestone-hs/deckstrings';
import { CardIds } from '@firestone-hs/reference-data';
import { CollectionManager, dustToCraftFor, getOwnedForDeckBuilding } from '@firestone/collection/services';
import { ColumnSortType, EnhancedDeckStat, ExtendedDeckStats, formatGamesCount } from '@firestone/constructed/common';
import { Card } from '@firestone/memory';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import {
	AbstractSubscriptionComponent,
	SortCriteria,
	SortDirection,
	arraysEqual,
	groupByFunction2,
	invertDirection,
} from '@firestone/shared/framework/common';
import { CardsFacadeService, ILocalizationService, getDateAgo } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, shareReplay, startWith, takeUntil } from 'rxjs/operators';

@Component({
	standalone: false,
	selector: 'meta-decks-visualization',
	styleUrls: ['./constructed-meta-decks-columns.scss', './meta-decks-visualization.component.scss'],
	template: `
		<ng-container
			*ngIf="{
				decks: decks$ | async,
				showStandardDeviation: showStandardDeviation$ | async,
				collection: collection$ | async,
				lastUpdate: lastUpdate$ | async,
				totalGames: totalGames$ | async,
			} as value"
		>
			<with-loading [isLoading]="!value.decks">
				<div class="constructed-meta-decks">
					<div class="data-info">
						<div class="label" [fsTranslate]="'app.decktracker.meta.last-updated'"></div>
						<div class="value" [helpTooltip]="lastUpdateFull$ | async">{{ value.lastUpdate }}</div>
						<div class="separator">-</div>
						<div class="label" [fsTranslate]="'app.decktracker.meta.total-games'"></div>
						<div class="value">{{ value.totalGames }}</div>
					</div>
					<div class="header" *ngIf="sortCriteria$ | async as sort">
						<sortable-table-label
							class="cell player-class"
							[name]="'app.decktracker.meta.class-header' | fsTranslate"
							[sort]="sort"
							[criteria]="'player-class'"
							(sortClick)="onSortClick($event)"
						>
						</sortable-table-label>
						<sortable-table-label
							class="cell name"
							[name]="'app.decktracker.meta.archetype-header' | fsTranslate"
							[sort]="sort"
							[criteria]="'archetype'"
							(sortClick)="onSortClick($event)"
						>
						</sortable-table-label>
						<sortable-table-label
							class="cell winrate"
							[name]="'app.decktracker.meta.winrate-header' | fsTranslate"
							[sort]="sort"
							[criteria]="'winrate'"
							(sortClick)="onSortClick($event)"
						>
						</sortable-table-label>
						<sortable-table-label
							class="cell games"
							[name]="'app.decktracker.meta.games-header' | fsTranslate"
							[sort]="sort"
							[criteria]="'games'"
							(sortClick)="onSortClick($event)"
						>
						</sortable-table-label>
						<sortable-table-label
							class="cell dust"
							[name]="'app.decktracker.meta.cost-header' | fsTranslate"
							[sort]="sort"
							[criteria]="'cost'"
							(sortClick)="onSortClick($event)"
						>
						</sortable-table-label>
						<div class="cell decklist"></div>
						<div class="cell cards">
							<span
								[fsTranslate]="'app.decktracker.meta.cards-header'"
								[helpTooltip]="'app.decktracker.meta.core-cards-header-tooltip' | fsTranslate"
							></span>
						</div>
					</div>
					<virtual-scroller
						#scroll
						class="decks-list"
						[items]="value.decks ?? []"
						[bufferAmount]="15"
						[attr.aria-label]="'Meta deck stats'"
						role="list"
						scrollable
					>
						<constructed-meta-deck-summary
							*ngFor="let deck of scroll.viewPortItems; trackBy: trackByDeck"
							class="deck"
							role="listitem"
							[deck]="deck"
							[showStandardDeviation]="!!value.showStandardDeviation"
							(deckSelected)="onDeckSelected($event)"
						></constructed-meta-deck-summary>
					</virtual-scroller>
				</div>
			</with-loading>
		</ng-container>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetaDecksVisualizationComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	@Output() deckSelected = new EventEmitter<EnhancedDeckStat>();

	decks$: Observable<EnhancedDeckStat[] | undefined>;
	collection$: Observable<readonly Card[]>;
	sortCriteria$: Observable<SortCriteria<ColumnSortType>>;
	showStandardDeviation$: Observable<boolean>;
	lastUpdate$: Observable<string | null>;
	lastUpdateFull$: Observable<string | null>;
	totalGames$: Observable<string>;

	@Input() set metaDecks(decks: ExtendedDeckStats | null) {
		this.metaDecks$$.next(decks);
	}

	@Input() set cardSearch(cardSearch: readonly string[] | null) {
		this.cardSearch$$.next(cardSearch ?? []);
	}

	private metaDecks$$ = new BehaviorSubject<ExtendedDeckStats | null>(null);
	private cardSearch$$ = new BehaviorSubject<readonly string[]>([]);
	private sortCriteria$$ = new BehaviorSubject<SortCriteria<ColumnSortType>>({
		criteria: 'games',
		direction: 'desc',
	});

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: ILocalizationService,
		private readonly collectionManager: CollectionManager,
		private readonly prefs: PreferencesService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await Promise.all([this.collectionManager.isReady(), this.prefs.isReady()]);

		this.sortCriteria$ = this.sortCriteria$$;
		this.showStandardDeviation$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => !prefs.constructedMetaDecksUseConservativeWinrate),
		);
		this.collection$ = this.collectionManager.collection$$.pipe(
			filter((collection) => !!collection),
			startWith([]),
			debounceTime(500),
			this.mapData((collection) => collection),
		);
		let ownedCardIdsCache: { [cardId: string]: number } = {};
		const collectionCache$ = this.collection$.pipe(
			this.mapData((collection) => {
				const result = {};
				for (const card of collection) {
					result[card.id] = card;
				}
				console.debug('updating collection', collection, result);
				return result;
			}),
		);
		collectionCache$.subscribe(() => {
			ownedCardIdsCache = {};
		});
		this.decks$ = combineLatest([
			this.metaDecks$$,
			this.cardSearch$$,
			this.sortCriteria$$,
			collectionCache$,
			this.prefs.preferences$$.pipe(
				this.mapData((prefs) => ({
					conservativeEstimate: prefs.constructedMetaDecksUseConservativeWinrate,
					sampleSize: prefs.constructedMetaDecksSampleSizeFilter,
					dust: prefs.constructedMetaDecksDustFilter,
					playerClasses: prefs.constructedMetaDecksPlayerClassFilter,
					archetypes: prefs.constructedMetaDecksArchetypeFilter,
				})),
				distinctUntilChanged(
					(a, b) =>
						a.conservativeEstimate === b.conservativeEstimate &&
						a.sampleSize === b.sampleSize &&
						a.dust === b.dust &&
						arraysEqual(a.playerClasses, b.playerClasses) &&
						arraysEqual(a.archetypes, b.archetypes),
				),
			),
		]).pipe(
			debounceTime(300),
			this.mapData(
				([
					stats,
					cardSearch,
					sortCriteria,
					collection,
					{ conservativeEstimate, sampleSize, dust, playerClasses, archetypes },
				]) => {
					// console.debug(
					// 	'base decks',
					// 	stats?.deckStats?.length,
					// 	sampleSize,
					// 	dust,
					// 	playerClasses,
					// 	archetypes,
					// );
					const enhanced = stats?.deckStats
						.filter((stat) => stat.totalGames >= sampleSize)
						.filter((stat) => !playerClasses?.length || playerClasses.includes(stat.playerClass))
						.filter((stat) => !archetypes?.length || archetypes.includes(stat.archetypeId))
						.filter(
							(stat) =>
								!cardSearch?.length || cardSearch.every((card) => stat.allCardsInDeck.includes(card)),
						)
						.map((stat) => {
							return this.enhanceStat(stat, ownedCardIdsCache, collection, conservativeEstimate);
						})
						.filter((stat) => dust === 'all' || dust == null || stat.dustCost <= +dust);
					// console.debug(
					// 	'enhanced decks',
					// 	enhanced?.length,
					// 	stats?.deckStats.filter((stat) => stat.totalGames >= sampleSize).length,
					// 	stats?.deckStats
					// 		.filter((stat) => stat.totalGames >= sampleSize)
					// 		.filter((stat) => !playerClasses?.length || playerClasses.includes(stat.playerClass))
					// 		.length,
					// 	stats?.deckStats
					// 		.filter((stat) => stat.totalGames >= sampleSize)
					// 		.filter((stat) => !playerClasses?.length || playerClasses.includes(stat.playerClass))
					// 		.filter((stat) => !archetypes?.length || archetypes.includes(stat.archetypeId))
					// 		.filter(
					// 			(stat) =>
					// 				!cardSearch?.length ||
					// 				cardSearch.every((card) => stat.allCardsInDeck.includes(card)),
					// 		).length,
					// );
					return enhanced?.sort((a, b) => this.sortDecks(a, b, sortCriteria));
				},
			),
			shareReplay(1),
			takeUntil(this.destroyed$),
		);
		this.totalGames$ = this.metaDecks$$.pipe(
			filter((stats) => !!stats),
			this.mapData((stats) => stats.dataPoints.toLocaleString(this.i18n.formatCurrentLocale())),
		);
		this.lastUpdate$ = this.metaDecks$$.pipe(
			this.mapData((stats) => {
				if (!stats?.lastUpdated) {
					return null;
				}
				const date = new Date(stats.lastUpdated);
				const now = new Date();
				const diff = now.getTime() - date.getTime();
				const days = diff / (1000 * 3600 * 24);
				if (days < 7) {
					return getDateAgo(date, this.i18n);
				}
				return date.toLocaleDateString(this.i18n.formatCurrentLocale());
			}),
		);
		this.lastUpdateFull$ = this.metaDecks$$.pipe(
			this.mapData((stats) => {
				if (!stats?.lastUpdated) {
					return null;
				}
				const date = new Date(stats.lastUpdated);
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

		const prefs = await this.prefs.getPreferences();
		this.sortCriteria$$.next(
			(prefs.constructedMetaDecksSortCriteria as SortCriteria<ColumnSortType>) ?? {
				criteria: 'games',
				direction: 'desc',
			},
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}

	async onSortClick(rawCriteria: string) {
		const criteria: ColumnSortType = rawCriteria as ColumnSortType;
		const newCrit = {
			criteria: criteria,
			direction:
				criteria === this.sortCriteria$$.value?.criteria
					? invertDirection(this.sortCriteria$$.value.direction)
					: 'desc',
		};
		this.sortCriteria$$.next(newCrit);
		const prefs = await this.prefs.getPreferences();
		const newPrefs: Preferences = {
			...prefs,
			constructedMetaDecksSortCriteria: newCrit,
		};
		await this.prefs.savePreferences(newPrefs);
	}

	trackByDeck(index: number, item: DeckStat | EnhancedDeckStat) {
		return item.decklist;
	}

	onDeckSelected(deck: EnhancedDeckStat) {
		this.deckSelected.emit(deck);
	}

	private enhanceStat(
		stat: DeckStat,
		ownedByCardId: { [cardId: string]: number },
		collection: { [cardId: string]: Card },
		conservativeEstimate: boolean,
	): EnhancedDeckStat {
		const deckDefinition = decode(stat.decklist);
		const sideboardCards =
			deckDefinition.sideboards?.flatMap((s) =>
				this.allCards.getCard(s.keyCardDbfId).id.startsWith(CardIds.ZilliaxDeluxe3000_TOY_330) ? [] : s.cards,
			) ?? [];
		const deckCards = [...deckDefinition.cards, ...sideboardCards].map((pair) => ({
			quantity: pair[1],
			card: this.allCards.getCardFromDbfId(pair[0]),
		}));
		const groupedByCardId = groupByFunction2(deckCards, (c) => c.card.id);
		const dustCost = Object.values(groupedByCardId)
			.map((cards) => ({
				quantity: cards.map((c) => c.quantity).reduce((a, b) => a + b, 0),
				cardId: cards[0].card.id,
			}))
			.filter((c) => !!this.allCards.getCard(c.cardId)?.collectible)
			.map((card) => {
				let owned = ownedByCardId[card.cardId];
				if (owned == null) {
					owned = getOwnedForDeckBuilding(card.cardId, collection, this.allCards) ?? 0;
					ownedByCardId[card.cardId] = owned;
				}
				const missingQuantity = Math.max(0, card.quantity - owned);
				const rarity = this.allCards.getCard(card.cardId)?.rarity ?? '';
				return dustToCraftFor(rarity) * missingQuantity;
			})
			.reduce((a, b) => a + b, 0);
		const heroCardClass = stat.playerClass?.toLowerCase();
		const standardDeviation = Math.sqrt((stat.winrate * (1 - stat.winrate)) / stat.totalGames);
		const conservativeWinrate: number = stat.winrate - 3 * standardDeviation;
		const winrateToUse = conservativeEstimate ? conservativeWinrate : stat.winrate;
		return {
			...stat,
			totalGames: formatGamesCount(stat.totalGames),
			rawWinrate: stat.winrate,
			dustCost: dustCost,
			heroCardClass: heroCardClass,
			standardDeviation: standardDeviation,
			conservativeWinrate: conservativeWinrate,
			winrate: winrateToUse,
			sideboards: deckDefinition.sideboards ?? [],
		};
	}

	private sortDecks(a: EnhancedDeckStat, b: EnhancedDeckStat, sortCriteria: SortCriteria<ColumnSortType>): number {
		switch (sortCriteria?.criteria) {
			case 'player-class':
				return this.sortByPlayerClass(a, b, sortCriteria.direction);
			case 'archetype':
				return this.sortByArchetype(a, b, sortCriteria.direction);
			case 'winrate':
				return this.sortByWinrate(a, b, sortCriteria.direction);
			case 'games':
				return this.sortByGames(a, b, sortCriteria.direction);
			case 'cost':
				return this.sortByCost(a, b, sortCriteria.direction);
			default:
				return 0;
		}
	}

	private sortByPlayerClass(a: EnhancedDeckStat, b: EnhancedDeckStat, direction: SortDirection): number {
		return direction === 'asc'
			? a.playerClass.localeCompare(b.playerClass)
			: b.playerClass.localeCompare(a.playerClass);
	}

	private sortByArchetype(a: EnhancedDeckStat, b: EnhancedDeckStat, direction: SortDirection): number {
		return direction === 'asc'
			? a.archetypeName.localeCompare(b.archetypeName)
			: b.archetypeName.localeCompare(a.archetypeName);
	}

	private sortByWinrate(a: EnhancedDeckStat, b: EnhancedDeckStat, direction: SortDirection): number {
		return direction === 'asc' ? a.winrate - b.winrate : b.winrate - a.winrate;
	}

	private sortByGames(a: EnhancedDeckStat, b: EnhancedDeckStat, direction: SortDirection): number {
		return direction === 'asc' ? a.totalGames - b.totalGames : b.totalGames - a.totalGames;
	}

	private sortByCost(a: EnhancedDeckStat, b: EnhancedDeckStat, direction: SortDirection): number {
		return direction === 'asc' ? a.dustCost - b.dustCost : b.dustCost - a.dustCost;
	}
}
