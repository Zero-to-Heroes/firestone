import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { ArchetypeStat, DeckStat } from '@firestone-hs/constructed-deck-stats';
import { Sideboard, decode } from '@firestone-hs/deckstrings';
import { SortCriteria, SortDirection, invertDirection } from '@firestone/shared/common/view';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { debounceTime, filter } from 'rxjs/operators';
import { Card } from '../../../models/card';
import { dustToCraftFor, getOwnedForDeckBuilding } from '../../../services/collection/collection-utils';
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
				archetypes: archetypes$ | async,
				showStandardDeviation: showStandardDeviation$ | async,
				collection: collection$ | async
			} as value"
		>
			<with-loading [isLoading]="!value.decks">
				<div class="constructed-meta-decks">
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
								[helpTooltip]="'app.decktracker.meta.cards-header-tooltip' | owTranslate"
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
							[archetypes]="value.archetypes"
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
	archetypes$: Observable<readonly ArchetypeStat[]>;
	collection$: Observable<readonly Card[]>;
	sortCriteria$: Observable<SortCriteria<ColumnSortType>>;
	showStandardDeviation$: Observable<boolean>;

	private sortCriteria$$ = new BehaviorSubject<SortCriteria<ColumnSortType>>({
		criteria: 'games',
		direction: 'desc',
	});

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.sortCriteria$ = this.sortCriteria$$.asObservable();
		this.showStandardDeviation$ = this.listenForBasicPref$(
			(prefs) => !prefs.constructedMetaDecksUseConservativeWinrate,
		);
		this.collection$ = this.store.collection$().pipe(
			filter((collection) => !!collection),
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
			this.store.constructedMetaDecks$(),
			this.sortCriteria$$,
			collectionCache$,
			this.store.listenPrefs$(
				(prefs) => prefs.constructedMetaDecksUseConservativeWinrate,
				(prefs) => prefs.constructedMetaDecksSampleSizeFilter,
				(prefs) => prefs.constructedMetaDecksDustFilter,
				(prefs) => prefs.constructedMetaDecksPlayerClassFilter,
			),
		]).pipe(
			debounceTime(300),
			this.mapData(
				([stats, sortCriteria, collection, [conservativeEstimate, sampleSize, dust, playerClasses]]) => {
					// let enhancedCounter = 0;
					console.debug('filtering decks', dust);
					const enhanced = stats?.deckStats
						.filter((stat) => stat.totalGames >= sampleSize)
						.filter((stat) => !playerClasses?.length || playerClasses.includes(stat.playerClass))
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
		);
		this.archetypes$ = this.store
			.constructedMetaDecks$()
			.pipe(this.mapData((stats) => stats?.archetypeStats ?? []));
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
