import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { FormControl } from '@angular/forms';
import { CardClass, CardType, GameFormat, ReferenceCard } from '@firestone-hs/reference-data';
import { VisualDeckCard } from '@models/decktracker/visual-deck-card';
import { DuelsBucketsData } from '@models/duels/duels-state';
import { CardsFacadeService } from '@services/cards-facade.service';
import { FeatureFlags } from '@services/feature-flags';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { DuelsDeckbuilderSaveDeckEvent } from '@services/mainwindow/store/events/duels/duels-deckbuilder-save-deck-event';
import { groupByFunction, sortByProperties } from '@services/utils';
import { DeckDefinition, encode } from 'deckstrings';
import { BehaviorSubject, combineLatest, from, Observable } from 'rxjs';
import { startWith, takeUntil, tap } from 'rxjs/operators';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../../abstract-subscription.component';

export const DEFAULT_CARD_WIDTH = 170;
export const DEFAULT_CARD_HEIGHT = 221;
@Component({
	selector: 'duels-deckbuilder-cards',
	styleUrls: [`../../../../../css/component/duels/desktop/deckbuilder/duels-deckbuilder-cards.component.scss`],
	template: `
		<div class="duels-deckbuilder-cards">
			<div class="deck-rename-container">
				<input class="name-input" [(ngModel)]="deckName" (mousedown)="preventDrag($event)" />
			</div>
			<ng-container *ngIf="{ activeCards: activeCards$ | async, buckets: possibleBuckets$ | async } as value">
				<div class="decklist-container">
					<div class="card-search">
						<label class="search-label">
							<div
								class="icon"
								inlineSVG="assets/svg/search.svg"
								[helpTooltip]="searchShortcutsTooltip"
								helpTooltipClasses="duels-deckbuilder-cards-search-tooltip"
							></div>
							<input
								[formControl]="searchForm"
								(keypress)="handleKeyPress($event, value.activeCards)"
								(mousedown)="onMouseDown($event)"
								[placeholder]="'app.collection.card-search.search-box-placeholder' | owTranslate"
							/>
						</label>
					</div>
					<deck-list
						class="deck-list"
						[cards]="currentDeckCards$ | async"
						(cardClicked)="onDecklistCardClicked($event)"
					>
					</deck-list>
					<div class="export-deck" *ngIf="{ valid: deckValid$ | async } as exportValue">
						<copy-deckstring
							class="copy-deckcode"
							*ngIf="exportValue.valid"
							[deckstring]="deckstring$ | async"
							[copyText]="'app.duels.deckbuilder.export-deckcode-button' | owTranslate"
						>
						</copy-deckstring>
						<ng-container *ngIf="deckstring$ | async as deckstring">
							<button
								class="save-deckcode"
								*ngIf="exportValue.valid"
								[helpTooltip]="'app.duels.deckbuilder.save-deckcode-button-tooltip' | owTranslate"
								(click)="saveDeck(deckstring)"
							>
								{{ saveDeckcodeButtonLabel }}
							</button></ng-container
						>
						<div class="invalid-text" *ngIf="!exportValue.valid">{{ ongoingText$ | async }}</div>
					</div>
				</div>
				<div class="results-container">
					<preference-toggle
						class="show-buckets-link"
						field="duelsDeckbuilderShowBuckets"
						[label]="'app.duels.deckbuilder.show-buckets-button-label' | owTranslate"
						[tooltip]="'app.duels.deckbuilder.show-buckets-button-tooltip' | owTranslate"
					></preference-toggle>
					<div class="results">
						<virtual-scroller
							class="cards-container"
							#scroll
							[items]="value.activeCards"
							bufferAmount="5"
							scrollable
						>
							<div
								*ngFor="let card of scroll.viewPortItems; trackBy: trackByCardId"
								class="card-container"
								[style.width.px]="cardWidth"
								[style.height.px]="cardHeight"
							>
								<div class="card">
									<img
										*ngIf="card?.imagePath"
										[src]="card.imagePath"
										[cardTooltip]="card.cardId"
										[cardTooltipPosition]="'right'"
										class="real-card"
										(click)="addCard(card)"
									/>
								</div>
							</div>
						</virtual-scroller>
						<div class="buckets-container" *ngIf="showBuckets$ | async">
							<div *ngFor="let bucket of value.buckets; trackBy: trackByBucketId" class="bucket">
								<div class="bucket-name">{{ bucket.bucketName }}</div>
								<div class="class-images">
									<img
										*ngFor="let bucketClass of bucket.bucketClasses"
										[src]="bucketClass.image"
										class="bucket-class"
										[helpTooltip]="bucketClass.name"
									/>
								</div>
								<button
									class="filter-button"
									inlineSVG="assets/svg/created_by.svg"
									[ngClass]="{ 'highlighted': isHighlighted(bucket.bucketId) }"
									(click)="toggleFilter(bucket.bucketId)"
									[helpTooltip]="'app.duels.deckbuilder.bucket-filter-button-tooltip' | owTranslate"
								></button>
								<div class="bucket-cards">
									<deck-list [cards]="bucket.bucketCardIds"></deck-list>
								</div>
							</div>
						</div>
					</div>
				</div>
			</ng-container>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsDeckbuilderCardsComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	enableDuelsBuckets = FeatureFlags.ENABLE_DUELS_DECK_BUILDER_BUCKETS;

	showBuckets$: Observable<boolean>;
	currentDeckCards$: Observable<readonly string[]>;
	toggledBucketFilters$: Observable<readonly string[]>;
	activeCards$: Observable<readonly DeckBuilderCard[]>;
	possibleBuckets$: Observable<readonly BucketData[]>;
	highRes$: Observable<boolean>;
	deckValid$: Observable<boolean>;
	deckstring$: Observable<string>;
	ongoingText$: Observable<string>;

	saveDeckcodeButtonLabel = this.i18n.translateString('app.duels.deckbuilder.save-deck-button');

	cardWidth: number;
	cardHeight: number;
	searchForm = new FormControl();

	searchShortcutsTooltip: string;
	deckName: string = this.i18n.translateString('decktracker.deck-name.unnamed-deck');

	private currentDeckCards = new BehaviorSubject<readonly string[]>([]);
	private toggledBucketFilters = new BehaviorSubject<readonly string[]>([]);

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.highRes$ = this.listenForBasicPref$((prefs) => prefs.collectionUseHighResImages);
		this.store
			.listenPrefs$((prefs) => prefs.collectionCardScale)
			.pipe(this.mapData(([pref]) => pref))
			.subscribe((value) => {
				const cardScale = value / 100;
				this.cardWidth = cardScale * DEFAULT_CARD_WIDTH;
				this.cardHeight = cardScale * DEFAULT_CARD_HEIGHT;
				if (!(this.cdr as ViewRef)?.destroyed) {
					this.cdr.detectChanges();
				}
			});
		const allCards$ = combineLatest(
			this.store.listen$(
				([main, nav]) => main.duels.config,
				([main, nav]) => main.duels.deckbuilder.currentClasses,
			),
			from([this.allCards.getCards()]),
		).pipe(
			this.mapData(([[config, currentClasses], cards]) => {
				const cardsWithDuplicates: readonly ReferenceCard[] = cards
					.filter((card) => card.collectible)
					.filter((card) => config.includedSets?.includes(card.set?.toLowerCase()))
					.filter(
						(card) =>
							!config.bannedCardsFromDeckbuilding?.length ||
							!config.bannedCardsFromDeckbuilding.includes(card.id),
					)
					.filter((card) => {
						const searchCardClasses: readonly CardClass[] = !!currentClasses?.length
							? [...currentClasses, CardClass.NEUTRAL]
							: [CardClass.NEUTRAL];
						const cardCardClasses: readonly CardClass[] = card.classes
							? card.classes.map((c) => CardClass[c])
							: !!card.cardClass
							? [CardClass[card.cardClass]]
							: [];
						return searchCardClasses.some((c) => cardCardClasses.includes(c));
					})
					.filter((card) => card.type?.toLowerCase() !== CardType[CardType.ENCHANTMENT].toLowerCase())
					// Filter "duplicates" between Core / Legacy / Vanilla
					.filter(
						(card) =>
							!card?.deckDuplicateDbfId ||
							// If the card is a duplicate of another card NOT included in the config, we keep it
							!config.includedSets?.includes(
								this.allCards.getCardFromDbfId(card.deckDuplicateDbfId).set?.toLowerCase(),
							),
					);
				const groupedByName = groupByFunction((card: ReferenceCard) => card.name)(cardsWithDuplicates);
				const result = Object.values(groupedByName).map((cards) => {
					if (cards.length === 1) {
						return cards[0];
					}
					console.debug('same card names', cards);
					return cards[0];
				});
				return result;
			}),
		);
		const collection$ = this.store
			.listen$(([main, nav]) => main.binder.collection)
			.pipe(this.mapData(([collection]) => collection));

		const searchString$ = this.searchForm.valueChanges.pipe(
			startWith(null),
			this.mapData((data: string) => data?.toLowerCase(), null, 50),
		);
		this.showBuckets$ = this.listenForBasicPref$((prefs) => prefs.duelsDeckbuilderShowBuckets);
		this.currentDeckCards$ = this.currentDeckCards.asObservable();
		this.toggledBucketFilters$ = this.toggledBucketFilters.asObservable();
		const allBuckets$ = this.store
			.listen$(
				([main, nav]) => main.duels.bucketsData,
				([main, nav]) => main.duels.deckbuilder.currentClasses,
			)
			.pipe(
				this.mapData(([buckets, currentClasses]) => {
					const candidateBuckets: readonly DuelsBucketsData[] = buckets.filter(
						(bucket) =>
							bucket.bucketClasses.includes(CardClass.NEUTRAL) ||
							(currentClasses ?? []).some((currentClass) => bucket.bucketClasses.includes(currentClass)),
					);
					return candidateBuckets.map((bucket) => {
						const bucketData: BucketData = {
							bucketId: bucket.bucketId,
							bucketName: this.allCards.getCard(bucket.bucketId)?.name,
							bucketClasses: bucket.bucketClasses.map((bucketClass) => ({
								class: bucketClass,
								name: this.i18n.translateString(`global.class.${CardClass[bucketClass].toLowerCase()}`),
								image: `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/deck/classes/${CardClass[
									bucketClass
								].toLowerCase()}.png`,
							})),
							bucketCardIds: bucket.cardIds,
							bucketCards: bucket.cardIds.map((cardId) => {
								const bucketCard: BucketCard = {
									cardId: cardId,
									cardName: this.allCards.getCard(cardId)?.name,
								};
								return bucketCard;
							}),
						};
						return bucketData;
					});
				}),
			);
		const cardIdsForMatchingBucketToggles$: Observable<readonly string[]> = combineLatest(
			this.toggledBucketFilters$,
			allBuckets$,
		).pipe(
			this.mapData(([toggledBucketFilters, allBuckets]) => {
				if (!toggledBucketFilters?.length) {
					return [];
				}
				const bucketsMatchingToggle = allBuckets.filter((bucket) =>
					toggledBucketFilters.includes(bucket.bucketId),
				);
				const allCardIds = bucketsMatchingToggle.flatMap((bucket) => bucket.bucketCardIds);
				const withDupes = allCardIds
					.map((cardId) => this.allCards.getCard(cardId))
					.flatMap((card) =>
						card.deckDuplicateDbfId
							? [card, this.allCards.getCardFromDbfId(card.deckDuplicateDbfId)]
							: [card],
					)
					.map((card) => card.id)
					.filter((cardId) => !!cardId);
				return [...new Set(withDupes)];
			}),
		);
		const allCardIdsInBucketsWithDuplicates$ = allBuckets$.pipe(
			this.mapData((allBuckets) =>
				allBuckets
					.flatMap((bucket) => bucket.bucketCardIds)
					.map((cardId) => this.allCards.getCard(cardId))
					.flatMap((card) =>
						card.deckDuplicateDbfId
							? [card, this.allCards.getCardFromDbfId(card.deckDuplicateDbfId)]
							: [card],
					)
					.map((card) => card.id)
					.filter((cardId) => !!cardId),
			),
		);
		this.activeCards$ = combineLatest(
			allCards$,
			collection$,
			searchString$,
			this.currentDeckCards$,
			cardIdsForMatchingBucketToggles$,
			allCardIdsInBucketsWithDuplicates$,
		).pipe(
			this.mapData(
				([
					allCards,
					collection,
					searchString,
					deckCards,
					cardIdsForMatchingBucketToggles,
					allCardIdsInBucketsWithDuplicates,
				]) => {
					const searchFilters = this.extractSearchFilters(searchString);
					const searchResult = allCards
						.filter((card) => !(deckCards ?? []).includes(card.id))
						.filter(
							(card) =>
								!cardIdsForMatchingBucketToggles?.length ||
								cardIdsForMatchingBucketToggles.includes(card.id),
						)
						.filter((card) =>
							this.doesCardMatchSearchFilters(card, allCardIdsInBucketsWithDuplicates, searchFilters),
						)
						.sort(
							sortByProperties((card: ReferenceCard) => [
								this.sorterForCardClass(card.cardClass),
								card.cost,
								card.name,
							]),
						)
						.map((card) => {
							const result: DeckBuilderCard = {
								cardId: card.id,
								name: card.name,
								imagePath: this.i18n.getCardImage(card.id, {
									isHighRes: false,
								}),
							};
							return result;
						});
					return searchResult;
				},
				null,
				50,
			),
		);
		this.possibleBuckets$ = combineLatest(allBuckets$, this.currentDeckCards$).pipe(
			this.mapData(([validBuckets, deckCardIds]) => {
				// Handle the cases of Core cards also present in the buckets
				const deckCardIdsWithDuplicates = deckCardIds
					.map((cardId) => this.allCards.getCard(cardId))
					.flatMap((card) =>
						card.deckDuplicateDbfId
							? [card, this.allCards.getCardFromDbfId(card.deckDuplicateDbfId)]
							: [card],
					)
					.map((card) => card.id);
				return validBuckets.filter((bucket) => {
					const cardIdsWithDuplicates = bucket.bucketCardIds
						.map((cardId) => this.allCards.getCard(cardId))
						.flatMap((card) =>
							card.deckDuplicateDbfId
								? [card, this.allCards.getCardFromDbfId(card.deckDuplicateDbfId)]
								: [card],
						)
						.map((card) => card.id);
					return cardIdsWithDuplicates.some((bucketCardId) =>
						deckCardIdsWithDuplicates.includes(bucketCardId),
					);
				});
			}),
			// Clean up eye icon for removed buckets
			tap((buckets: readonly BucketData[]) => {
				const activeBucketIds = this.toggledBucketFilters.value;
				const newBuckets = activeBucketIds.filter((activeBucketId) =>
					buckets.some((bucket) => bucket.bucketId === activeBucketId),
				);
				this.toggledBucketFilters.next(newBuckets);
			}),
			takeUntil(this.destroyed$),
		);
		this.deckValid$ = this.currentDeckCards$.pipe(
			this.mapData((cards) => {
				return cards?.length === 15 && cards.length === new Set(cards).size;
			}),
		);
		this.deckstring$ = combineLatest(
			this.currentDeckCards$,
			this.store.listen$(([main, nav]) => main.duels.deckbuilder.currentHeroCardId),
		).pipe(
			this.mapData(([cards, [hero]]) => {
				const cardDbfIds = cards
					.map((cardId) => this.allCards.getCard(cardId).dbfId)
					.map((dbfId) => [dbfId, 1] as [number, number]);
				const heroDbfId = this.allCards.getCard(hero).dbfId ?? 7;
				const deckDefinition: DeckDefinition = {
					format: GameFormat.FT_WILD,
					cards: cardDbfIds,
					heroes: [heroDbfId],
				};
				const deckstring = encode(deckDefinition);
				return deckstring;
			}),
		);
		this.ongoingText$ = this.currentDeckCards$.pipe(
			this.mapData((cards) =>
				this.i18n.translateString('app.duels.deckbuilder.ongoing-deck-building', {
					currentCards: cards?.length ?? 0,
					maxCards: 15,
				}),
			),
		);

		this.searchShortcutsTooltip = `
			<div class="tooltip-container">
				${this.i18n.translateString('app.duels.deckbuilder.search-tooltip.text')}
				<ul class="shortcuts">
					<li>${this.i18n.translateString('app.duels.deckbuilder.search-tooltip.info-1')}</li>
					<li>${this.i18n.translateString('app.duels.deckbuilder.search-tooltip.info-2')}</li>
					<li>${this.i18n.translateString('app.duels.deckbuilder.search-tooltip.info-3')}</li>
					<li>${this.i18n.translateString('app.duels.deckbuilder.search-tooltip.info-4')}</li>
				</ul>
			</div>
		`;
	}

	trackByCardId(index: number, item: DeckBuilderCard) {
		return item.cardId;
	}

	trackByBucketId(index: number, item: BucketData) {
		return item.bucketId;
	}

	addCard(card: DeckBuilderCard) {
		this.currentDeckCards.next([...this.currentDeckCards.value, card.cardId]);
	}

	handleKeyPress(event: KeyboardEvent, activeCards: readonly DeckBuilderCard[]) {
		// Ignore the alt-tab
		if (event.altKey) {
			event.preventDefault();
		}

		if (!activeCards?.length) {
			return;
		}

		if (event.code === 'Enter') {
			const newDeckCards = [...this.currentDeckCards.value, activeCards[0].cardId];
			this.currentDeckCards.next(newDeckCards);

			if (event.shiftKey) {
				this.searchForm.setValue(null);
			}
		}
	}

	onMouseDown(event: Event) {
		event.stopPropagation();
	}

	onDecklistCardClicked(card: VisualDeckCard) {
		const deckCards = [...this.currentDeckCards.value];
		deckCards.splice(
			deckCards.findIndex((cardId) => cardId === card.cardId),
			1,
		);
		this.currentDeckCards.next(deckCards);
	}

	saveDeck(deckstring: string) {
		this.store.send(new DuelsDeckbuilderSaveDeckEvent(deckstring, this.deckName));
		this.saveDeckcodeButtonLabel = this.i18n.translateString('app.duels.deckbuilder.deck-saved-info');
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
		setTimeout(() => {
			this.saveDeckcodeButtonLabel = this.i18n.translateString('app.duels.deckbuilder.save-deck-button');
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		}, 2000);
	}

	isHighlighted(bucketId: string): boolean {
		return this.toggledBucketFilters.value.includes(bucketId);
	}

	toggleFilter(bucketId: string) {
		const existingFilters = this.toggledBucketFilters.value;
		const newFilters = existingFilters.includes(bucketId)
			? existingFilters.filter((filter) => filter !== bucketId)
			: [...existingFilters, bucketId];
		this.toggledBucketFilters.next(newFilters);
	}

	preventDrag(event: MouseEvent) {
		event.stopPropagation();
	}

	private sorterForCardClass(cardClass: string): number {
		const cardClassAsEnum: CardClass = CardClass[cardClass];
		switch (cardClassAsEnum) {
			case CardClass.NEUTRAL:
				return 99;
			default:
				return cardClass.charCodeAt(0);
		}
	}

	private doesCardMatchSearchFilters(
		card: ReferenceCard,
		allCardIdsInBuckets: readonly string[],
		searchFilters: SearchFilters,
	): boolean {
		if (!searchFilters) {
			return true;
		}

		if (searchFilters.class && !card.playerClass?.toLowerCase().includes(searchFilters.class)) {
			return false;
		}

		if (searchFilters.bucket === 'none') {
			card.id.includes('BT_480') &&
				console.debug(
					'filtering',
					card,
					allCardIdsInBuckets.filter((c) => c.includes('BT_480')),
				);
			const allRelatedCardIds = [card.id, this.allCards.getCardFromDbfId(card.deckDuplicateDbfId)?.id].filter(
				(cardId) => cardId,
			);
			return allRelatedCardIds.every((cardId) => !allCardIdsInBuckets.includes(cardId));
		}

		return (
			!searchFilters?.text?.length ||
			card.name.toLowerCase().includes(searchFilters.text) ||
			card.text?.toLowerCase().includes(searchFilters.text) ||
			card.spellSchool?.toLowerCase().includes(searchFilters.text) ||
			card.race?.toLowerCase().includes(searchFilters.text) ||
			card.referencedTags?.some((tag) => tag.toLowerCase().includes(searchFilters.text))
		);
	}

	private extractSearchFilters(searchString: string): SearchFilters {
		if (!searchString?.length) {
			return null;
		}

		let result: SearchFilters = {} as SearchFilters;

		const fragments = searchString.split(' ');
		const searchTerms: string[] = [];

		const fragmentProcessors = [
			{
				name: 'class',
				updater: (result: SearchFilters, fragment) => ({ ...result, class: fragment.toLowerCase() }),
			},
			{
				name: 'bucket',
				updater: (result: SearchFilters, fragment) => ({ ...result, bucket: fragment.toLowerCase() }),
			},
		];

		for (const fragment of fragments) {
			let updated = false;
			for (const processor of fragmentProcessors) {
				const [newResult, newUpdated] = this.handleSearchFragment(
					result,
					fragment,
					processor.name,
					processor.updater,
				);
				result = newResult;
				updated = updated || newUpdated;
			}

			if (!updated) {
				searchTerms.push(fragment);
			}
		}

		result = { ...result, text: searchTerms.join(' ') };
		return result;
	}

	private handleSearchFragment(
		currentResult: SearchFilters,
		fragment: string,
		fragmentName: string,
		updater: (currentResult: SearchFilters, fragment: any) => SearchFilters,
	): [SearchFilters, boolean] {
		const regex = new RegExp(`${fragmentName}:([^\s]+)`);
		const search = fragment.match(regex);
		const arg = !!search ? search[1] : null;
		if (arg?.length) {
			return [updater(currentResult, arg), true];
		}
		return [currentResult, false];
	}
}

interface DeckBuilderCard {
	readonly cardId: string;
	readonly name: string;
	readonly imagePath: string;
}

interface SearchFilters {
	readonly class: string;
	readonly text: string;
	readonly bucket: 'none';
}

interface BucketData {
	readonly bucketId: string;
	readonly bucketName: string;
	readonly bucketClasses: readonly BucketClass[];
	readonly bucketCards: readonly BucketCard[];
	readonly bucketCardIds: readonly string[];
}

interface BucketClass {
	readonly class: CardClass;
	readonly name: string;
	readonly image: string;
}

interface BucketCard {
	readonly cardId: string;
	readonly cardName: string;
}
