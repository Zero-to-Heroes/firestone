import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { DeckStat } from '@firestone-hs/constructed-deck-stats';
import { Sideboard, decode } from '@firestone-hs/deckstrings';
import { Card } from '@firestone/memory';
import { SortCriteria, SortDirection, invertDirection } from '@firestone/shared/common/view';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { debounceTime, filter, shareReplay, startWith, takeUntil } from 'rxjs/operators';
import { dustToCraftFor, getOwnedForDeckBuilding } from '../../../services/collection/collection-utils';
import { ConstructedMetaDecksStateService } from '../../../services/decktracker/constructed-meta-decks-state-builder.service';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../abstract-subscription-store.component';

@Component({
	selector: 'constructed-meta-decks',
	styleUrls: [
		`../../../../css/component/decktracker/main/constructed-meta-decks-columns.scss`,
		`../../../../css/component/decktracker/main/constructed-meta-decks.component.scss`,
	],
	template: `
		<ng-container
			*ngIf="{
				decks: decks$ | async,
				showStandardDeviation: showStandardDeviation$ | async,
				collection: collection$ | async,
				lastUpdate: lastUpdate$ | async,
				totalGames: totalGames$ | async
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
							[name]="'app.decktracker.meta.class-header' | owTranslate"
							[sort]="sort"
							[criteria]="'player-class'"
							(sortClick)="onSortClick($event)"
						>
						</sortable-table-label>
						<sortable-table-label
							class="cell name"
							[name]="'app.decktracker.meta.archetype-header' | owTranslate"
							[sort]="sort"
							[criteria]="'archetype'"
							(sortClick)="onSortClick($event)"
						>
						</sortable-table-label>
						<sortable-table-label
							class="cell dust"
							[name]="'app.decktracker.meta.cost-header' | owTranslate"
							[sort]="sort"
							[criteria]="'cost'"
							(sortClick)="onSortClick($event)"
						>
						</sortable-table-label>
						<sortable-table-label
							class="cell winrate"
							[name]="'app.decktracker.meta.winrate-header' | owTranslate"
							[sort]="sort"
							[criteria]="'winrate'"
							(sortClick)="onSortClick($event)"
						>
						</sortable-table-label>
						<sortable-table-label
							class="cell games"
							[name]="'app.decktracker.meta.games-header' | owTranslate"
							[sort]="sort"
							[criteria]="'games'"
							(sortClick)="onSortClick($event)"
						>
						</sortable-table-label>
						<div class="cell cards">
							<span
								[owTranslate]="'app.decktracker.meta.cards-header'"
								[helpTooltip]="'app.decktracker.meta.core-cards-header-tooltip' | owTranslate"
							></span>
						</div>
					</div>
					<virtual-scroller
						#scroll
						class="decks-list"
						[items]="value.decks"
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
							[showStandardDeviation]="value.showStandardDeviation"
						></constructed-meta-deck-summary>
					</virtual-scroller>
				</div>
			</with-loading>
		</ng-container>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConstructedMetaDecksComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	decks$: Observable<DeckStat[]>;
	collection$: Observable<readonly Card[]>;
	sortCriteria$: Observable<SortCriteria<ColumnSortType>>;
	showStandardDeviation$: Observable<boolean>;
	lastUpdate$: Observable<string>;
	lastUpdateFull$: Observable<string>;
	totalGames$: Observable<string>;

	private sortCriteria$$ = new BehaviorSubject<SortCriteria<ColumnSortType>>({
		criteria: 'games',
		direction: 'desc',
	});

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
		private readonly constructedMetaStats: ConstructedMetaDecksStateService,
		private readonly i18n: LocalizationFacadeService,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		await this.constructedMetaStats.isReady();

		this.sortCriteria$ = this.sortCriteria$$.asObservable();
		this.showStandardDeviation$ = this.listenForBasicPref$(
			(prefs) => !prefs.constructedMetaDecksUseConservativeWinrate,
		);
		this.collection$ = this.store.collection$().pipe(
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
		collectionCache$.subscribe((cache) => {
			ownedCardIdsCache = {};
		});
		this.decks$ = combineLatest([
			this.constructedMetaStats.constructedMetaDecks$$,
			this.constructedMetaStats.cardSearch$$,
			this.sortCriteria$$,
			collectionCache$,
			this.store.listenPrefs$(
				(prefs) => prefs.constructedMetaDecksUseConservativeWinrate,
				(prefs) => prefs.constructedMetaDecksSampleSizeFilter,
				(prefs) => prefs.constructedMetaDecksDustFilter,
				(prefs) => prefs.constructedMetaDecksPlayerClassFilter,
				(prefs) => prefs.constructedMetaDecksArchetypeFilter,
			),
		]).pipe(
			debounceTime(300),
			this.mapData(
				([
					stats,
					cardSearch,
					sortCriteria,
					collection,
					[conservativeEstimate, sampleSize, dust, playerClasses, archetypes],
				]) => {
					// let enhancedCounter = 0;
					console.debug('filtering decks', dust);
					const enhanced = stats?.deckStats
						.filter((stat) => stat.totalGames >= sampleSize)
						.filter((stat) => !playerClasses?.length || playerClasses.includes(stat.playerClass))
						.filter((stat) => !archetypes?.length || archetypes.includes(stat.archetypeId))
						.filter(
							(stat) =>
								!cardSearch?.length || cardSearch.every((card) => stat.allCardsInDeck.includes(card)),
						)
						.map((stat) => {
							// enhancedCounter++;
							// console.debug('enhancedCounter', enhancedCounter);
							return this.enhanceStat(stat, ownedCardIdsCache, collection, conservativeEstimate);
						})
						.filter((stat) => dust === 'all' || dust == null || stat.dustCost <= +dust);
					// console.debug('enhanced', enhanced);
					return enhanced?.sort((a, b) => this.sortDecks(a, b, sortCriteria));
				},
			),
			shareReplay(1),
			takeUntil(this.destroyed$),
		);
		this.totalGames$ = this.constructedMetaStats.constructedMetaDecks$$.pipe(
			this.mapData((stats) => stats.dataPoints.toLocaleString(this.i18n.formatCurrentLocale())),
			takeUntil(this.destroyed$),
		);
		this.lastUpdate$ = this.constructedMetaStats.constructedMetaDecks$$.pipe(
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
				return date.toLocaleDateString(this.i18n.formatCurrentLocale());
			}),
		);
		this.lastUpdateFull$ = this.constructedMetaStats.constructedMetaDecks$$.pipe(
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

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
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

	trackByDeck(index: number, item: DeckStat) {
		return item.decklist;
	}

	private enhanceStat(
		stat: DeckStat,
		ownedByCardId: { [cardId: string]: number },
		collection: { [cardId: string]: Card },
		conservativeEstimate: boolean,
	): EnhancedDeckStat {
		const deckDefinition = decode(stat.decklist);
		const deckCards = [...deckDefinition.cards, ...(deckDefinition.sideboards ?? []).flatMap((s) => s.cards)].map(
			(pair) => ({
				quantity: pair[1],
				card: this.allCards.getCardFromDbfId(pair[0]),
			}),
		);
		const dustCost = deckCards
			.map((c) => ({ quantity: c.quantity, cardId: c.card.id }))
			.map((card) => {
				let owned = ownedByCardId[card.cardId];
				// owned = 0;
				// Cache not populated yet
				if (owned == null) {
					owned = getOwnedForDeckBuilding(card.cardId, collection, this.allCards) ?? 0;
					// console.debug(
					// 	'recomputing cache for',
					// 	card.cardId,
					// 	owned,
					// 	Object.keys(ownedByCardId).length,
					// 	owned,
					// );
					ownedByCardId[card.cardId] = owned;
				}
				const missingQuantity = Math.max(0, card.quantity - owned);
				const rarity = this.allCards.getCard(card.cardId)?.rarity;
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
			sideboards: deckDefinition.sideboards,
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

export type ColumnSortType = 'player-class' | 'archetype' | 'winrate' | 'games' | 'cost';

export interface EnhancedDeckStat extends DeckStat {
	readonly dustCost: number;
	readonly rawWinrate: number;
	readonly heroCardClass: string;
	readonly standardDeviation: number;
	readonly conservativeWinrate: number;
	readonly sideboards: readonly Sideboard[];
}

export const formatGamesCount = (value: number): number => {
	if (value >= 1000) {
		return 1000 * Math.round(value / 1000);
	} else if (value >= 100) {
		return 100 * Math.round(value / 100);
	} else if (value >= 10) {
		return 10 * Math.round(value / 10);
	}
	return value;
};

export const getDateAgo = (date: Date, i18n: LocalizationFacadeService): string => {
	const now = new Date();
	const diff = now.getTime() - date.getTime();
	const hours = diff / (1000 * 3600);
	if (hours < 1) {
		return i18n.translateString('global.duration.ago.less-than-an-hour-ago');
	}
	if (hours < 24) {
		return i18n.translateString('global.duration.ago.hours-ago', {
			value: Math.round(hours),
		});
	}
	const days = diff / (1000 * 3600 * 24);
	if (days < 7) {
		return i18n.translateString('global.duration.ago.days-ago', {
			value: Math.round(days),
		});
	}
	return i18n.translateString('global.duration.ago.weeks-ago', {
		value: Math.round(days / 7),
	});
};
