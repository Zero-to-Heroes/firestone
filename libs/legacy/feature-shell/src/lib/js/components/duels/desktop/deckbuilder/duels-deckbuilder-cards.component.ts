import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { FormControl } from '@angular/forms';
import { BucketCard } from '@components/duels/desktop/deckbuilder/duels-bucket-cards-list.component';
import { DeckDefinition, encode } from '@firestone-hs/deckstrings';
import { CardClass, CardType, GameFormat, Race, ReferenceCard } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { VisualDeckCard } from '@models/decktracker/visual-deck-card';
import { FeatureFlags } from '@services/feature-flags';
import { dustToCraftFor, normalizeDeckHeroDbfId } from '@services/hs-utils';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { DuelsDeckbuilderSaveDeckEvent } from '@services/mainwindow/store/events/duels/duels-deckbuilder-save-deck-event';
import { groupByFunction, sortByProperties, sumOnArray } from '@services/utils';
import { BehaviorSubject, Observable, combineLatest, from } from 'rxjs';
import { startWith, takeUntil, tap } from 'rxjs/operators';
import { SetCard } from '../../../../models/set';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

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
			<ng-container
				*ngIf="{
					allowedCards: allowedCards$ | async,
					activeCards: activeCards$ | async,
					buckets: possibleBuckets$ | async,
					showRelatedCards: showRelatedCards$ | async,
					showBuckets: showBuckets$ | async,
					deckstring: deckstring$ | async
				} as value"
			>
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
					<deck-list-static
						class="deck-list"
						[deckstring]="value.deckstring"
						[collection]="collection$ | async"
						(cardClicked)="onDecklistCardClicked($event)"
					>
					</deck-list-static>
					<div class="export-deck" *ngIf="{ valid: deckValid$ | async } as exportValue">
						<copy-deckstring
							class="copy-deckcode"
							*ngIf="exportValue.valid"
							[deckstring]="value.deckstring"
							[copyText]="'app.duels.deckbuilder.export-deckcode-button' | owTranslate"
						>
						</copy-deckstring>
						<ng-container *ngIf="value.deckstring">
							<button
								class="save-deckcode"
								*ngIf="exportValue.valid"
								[helpTooltip]="'app.duels.deckbuilder.save-deckcode-button-tooltip' | owTranslate"
								(click)="saveDeck(value.deckstring)"
							>
								{{ saveDeckcodeButtonLabel }}
							</button></ng-container
						>
						<div class="invalid-text" *ngIf="!exportValue.valid">{{ ongoingText$ | async }}</div>
					</div>
					<div class="missing-dust" *ngIf="missingDust$ | async as missingDust">
						<div
							class="dust-amount"
							[helpTooltip]="
								'app.duels.deckbuilder.missing-dust-tooltip' | owTranslate: { value: missingDust }
							"
						>
							{{ missingDust }}
						</div>
						<div class="dust-icon" inlineSVG="assets/svg/rewards/reward_dust.svg"></div>
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
							*ngIf="value.activeCards?.length; else emptyState"
							[items]="value.activeCards"
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
										[cardTooltipShowRelatedCards]="value.showRelatedCards"
										class="real-card"
										(click)="addCard(card)"
									/>
									<div
										class="buckets-info"
										*ngIf="value.showBuckets && card.numberOfBuckets > 1"
										[helpTooltip]="
											'app.duels.deckbuilder.part-of-multiple-buckets-tooltip'
												| owTranslate: { value: card.numberOfBuckets }
										"
									>
										<div>
											{{ card.numberOfBuckets }}
										</div>
									</div>
								</div>
							</div>
						</virtual-scroller>
						<ng-template #emptyState>
							<collection-empty-state [searchString]="searchString$ | async"> </collection-empty-state>
						</ng-template>
						<div class="buckets-container" *ngIf="value.showBuckets" scrollable>
							<div
								*ngFor="let bucket of value.buckets; trackBy: trackByBucketId"
								class="bucket"
								[attr.data-bucket-id]="bucket.bucketId"
							>
								<div class="bucket-name">{{ bucket.bucketName }}</div>
								<!-- <div class="class-images">
									<img
										*ngFor="let bucketClass of bucket.bucketClasses"
										[src]="bucketClass.image"
										class="bucket-class"
										[helpTooltip]="bucketClass.name"
									/>
								</div> -->
								<button
									class="filter-button"
									inlineSVG="assets/svg/created_by.svg"
									[ngClass]="{ highlighted: isHighlighted(bucket.bucketId) }"
									(click)="toggleFilter(bucket.bucketId)"
									[helpTooltip]="'app.duels.deckbuilder.bucket-filter-button-tooltip' | owTranslate"
								></button>
								<div class="bucket-cards">
									<duels-bucket-cards-list
										[cards]="bucket.bucketCards"
										(cardClick)="onBucketCardClick($event, value.allowedCards)"
									></duels-bucket-cards-list>
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
export class DuelsDeckbuilderCardsComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	enableDuelsBuckets = FeatureFlags.ENABLE_DUELS_DECK_BUILDER_BUCKETS;

	showBuckets$: Observable<boolean>;
	currentDeckCards$: Observable<readonly string[]>;
	toggledBucketFilters$: Observable<readonly string[]>;
	activeCards$: Observable<DeckBuilderCard[]>;
	possibleBuckets$: Observable<readonly BucketData[]>;
	highRes$: Observable<boolean>;
	showRelatedCards$: Observable<boolean>;
	deckValid$: Observable<boolean>;
	deckstring$: Observable<string>;
	searchString$: Observable<string>;
	ongoingText$: Observable<string>;
	allowedCards$: Observable<ReferenceCardWithBucket[]>;
	collection$: Observable<readonly SetCard[]>;
	missingDust$: Observable<number>;

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
		this.showRelatedCards$ = this.listenForBasicPref$((prefs) => prefs.collectionShowRelatedCards);
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
		const allBuckets$ = this.store
			.listen$(
				([main, nav]) => main.duels.bucketsData,
				([main, nav]) => main.duels.deckbuilder.currentClasses,
			)
			.pipe(
				this.mapData(([buckets, currentClasses]) => {
					// const candidateBuckets: readonly DuelsBucketsData[] = buckets.filter(
					// 	(bucket) =>
					// 		bucket.bucketClasses.includes(CardClass.NEUTRAL) ||
					// 		bucket.bucketClasses.includes(CardClass.DEATHKNIGHT) ||
					// 		(currentClasses ?? []).some((currentClass) => bucket.bucketClasses.includes(currentClass)),
					// );
					return buckets.map((bucket) => {
						const cardsForClass = bucket.cards.filter((card) => {
							const refCard = this.allCards.getCard(card.cardId);
							return (
								refCard.cardClass === CardClass[CardClass.NEUTRAL] ||
								!refCard.cardClass ||
								currentClasses.some((c: CardClass) => c === CardClass[refCard.cardClass])
							);
						});
						const totalCardsOffered = sumOnArray(cardsForClass, (card) => card.totalOffered);
						const bucketCards = cardsForClass
							.map((card) => {
								const totalBuckets = buckets.filter((b) =>
									b.cards.map((c) => c.cardId).includes(card.cardId),
								).length;
								const refCard = this.allCards.getCard(card.cardId);
								const bucketCard: BucketCard = {
									cardId: card.cardId,
									cardName: refCard.name,
									manaCost: refCard.cost,
									rarity: refCard.rarity?.toLowerCase(),
									offeringRate: card.totalOffered / totalCardsOffered,
									totalBuckets: totalBuckets,
								};
								return bucketCard;
							})
							.sort(
								(a, b) =>
									a.manaCost - b.manaCost ||
									(a.cardName?.toLowerCase() < b.cardName?.toLowerCase() ? -1 : 1),
							);
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
							bucketCardIds: bucketCards.map((c) => c.cardId),
							bucketCards: bucketCards,
						};
						return bucketData;
					});
				}),
			);
		this.allowedCards$ = combineLatest(
			this.store.listen$(
				([main, nav]) => main.duels.config,
				([main, nav]) => main.duels.deckbuilder.currentClasses,
			),
			allBuckets$,
			from([this.allCards.getCards()]),
		).pipe(
			this.mapData(([[config, currentClasses], allBuckets, cards]) => {
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
					.filter((card) => card.type?.toLowerCase() !== CardType[CardType.ENCHANTMENT].toLowerCase());
				const groupedByName = groupByFunction((card: ReferenceCard) => card.name)(cardsWithDuplicates);
				const result = Object.values(groupedByName)
					.map((cards) => {
						if (cards.length === 1) {
							return cards[0];
						}
						const allowed = cards.filter((c) => config.includedSets?.includes(c.set?.toLowerCase()));
						if (allowed.length === 1) {
							return allowed[0];
						}
						const original = allowed.filter((c) => !!c.deckDuplicateDbfId);
						if (original.length === 1) {
							return original[0];
						}
						// Core will probably always be allowed in deckbuilding
						const core = allowed.filter((c) => c.set?.toLowerCase() === 'core');
						if (core.length === 1) {
							return core[0];
						}

						return cards[0];
					})
					.map((card) => ({
						...card,
						numberOfBuckets: allBuckets.filter((b) => b.bucketCardIds.includes(card.id)).length,
					}));
				return result;
			}),
		);
		this.collection$ = this.store
			.sets$()
			.pipe(
				this.mapData(
					(allSets) =>
						allSets.map((set) => set.allCards).reduce((a, b) => a.concat(b), []) as readonly SetCard[],
				),
			);

		this.searchString$ = this.searchForm.valueChanges.pipe(
			startWith(null),
			this.mapData((data: string) => data?.toLowerCase(), null, 50),
		);
		this.showBuckets$ = this.listenForBasicPref$((prefs) => prefs.duelsDeckbuilderShowBuckets);
		this.currentDeckCards$ = this.currentDeckCards.asObservable();
		this.toggledBucketFilters$ = this.toggledBucketFilters.asObservable();
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
				const withDupeCards: readonly ReferenceCard[] = allCardIds
					.map((cardId) => this.allCards.getCard(cardId))
					.flatMap((card) =>
						card.deckDuplicateDbfId
							? [card, this.allCards.getCardFromDbfId(card.deckDuplicateDbfId)]
							: [card, ...this.allCards.getCards().filter((c) => c.deckDuplicateDbfId === card.dbfId)],
					)
					.filter((card) => !!card);
				const withDupes = withDupeCards.map((card) => card.id).filter((cardId) => !!cardId);
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
			combineLatest(this.allowedCards$, this.collection$, this.searchString$, this.currentDeckCards$),
			combineLatest(cardIdsForMatchingBucketToggles$, allCardIdsInBucketsWithDuplicates$, allBuckets$),
		).pipe(
			this.mapData(
				([
					[allCards, collection, searchString, deckCards],
					[cardIdsForMatchingBucketToggles, allCardIdsInBucketsWithDuplicates, allBuckets],
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
								numberOfBuckets: card.numberOfBuckets,
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
				const deckCardIdsWithDuplicates =
					deckCardIds
						?.map((cardId) => this.allCards.getCard(cardId))
						.flatMap((card) =>
							card.deckDuplicateDbfId
								? [card, this.allCards.getCardFromDbfId(card.deckDuplicateDbfId)]
								: [card],
						)
						.map((card) => card.id) ?? [];
				const result = validBuckets
					.filter((bucket) => {
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
					})
					.sort(sortByProperties((b) => [b.bucketName]));
				return result;
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
		// Init cards if they already exist in the store (because of a deck import for instance)
		this.store
			.listen$(([main, nav]) => main.duels.deckbuilder.currentCards)
			.pipe(this.mapData(([cards]) => cards))
			.subscribe((cards) => this.currentDeckCards.next(cards));
		this.deckstring$ = combineLatest(
			this.currentDeckCards$,
			this.store.listen$(
				([main, nav]) => main.duels.deckbuilder.currentHeroCardId,
				([main, nav]) => main.duels.deckbuilder.currentSignatureTreasureCardId,
			),
		).pipe(
			this.mapData(([cards, [hero, currentSignatureTreasureCardId]]) => {
				const cardDbfIds =
					cards
						?.map((cardId) => this.allCards.getCard(cardId).dbfId)
						.map((dbfId) => [dbfId, 1] as [number, number]) ?? [];
				const treasureCard = this.allCards.getCard(currentSignatureTreasureCardId);
				const defaultTreasureCardClass = treasureCard.cardClass?.toUpperCase() ?? CardClass[CardClass.NEUTRAL];
				const duelsClass: CardClass =
					treasureCard.classes?.length > 1 ? null : CardClass[defaultTreasureCardClass];
				const heroDbfId = normalizeDeckHeroDbfId(this.allCards.getCard(hero).dbfId, this.allCards, duelsClass);
				const deckDefinition: DeckDefinition = {
					format: GameFormat.FT_WILD,
					cards: cardDbfIds,
					heroes: [heroDbfId ?? 7],
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
		this.missingDust$ = combineLatest(this.currentDeckCards$, this.collection$).pipe(
			this.mapData(([cards, collection]) => {
				const groupedByCardId = groupByFunction((cardId: string) => cardId)(cards ?? []);
				return Object.keys(groupedByCardId)
					.map((cardId) => {
						const neededCards = groupedByCardId[cardId].length;
						const cardInCollection = collection.find((c) => c.id === cardId);
						const owned = cardInCollection?.getTotalOwned() ?? 0;
						const missingCards = Math.max(0, neededCards - owned);
						const rarity = this.allCards.getCard(cardId).rarity;
						const totalDust = !!rarity ? missingCards * dustToCraftFor(rarity) : 0;
						return totalDust;
					})
					.reduce((a, b) => a + b, 0);
			}),
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
		this.currentDeckCards.next([...(this.currentDeckCards.value ?? []), card.cardId]);
	}

	onBucketCardClick(card: BucketCard, allowedCards: readonly ReferenceCard[]) {
		if ((this.currentDeckCards.value ?? []).includes(card.cardId)) {
			return;
		}

		// Because of duplicates, we use the name
		if (!allowedCards.map((c) => c.name).includes(card.cardName)) {
			return;
		}

		this.currentDeckCards.next([...(this.currentDeckCards.value ?? []), card.cardId]);
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
			const newDeckCards = [...(this.currentDeckCards.value ?? []), activeCards[0].cardId];
			this.currentDeckCards.next(newDeckCards);

			if (event.shiftKey || activeCards.length === 1) {
				this.searchForm.setValue(null);
			}
		}
	}

	onMouseDown(event: Event) {
		event.stopPropagation();
	}

	onDecklistCardClicked(card: VisualDeckCard) {
		const deckCards = [...(this.currentDeckCards.value ?? [])];
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
			card.races?.some((race) => race.toLowerCase().includes(searchFilters.text)) ||
			(Object.values(Race)
				.filter((race) => isNaN(Number(race)))
				.map((r) => r as string)
				.map((r) => r.toLowerCase())
				.includes(searchFilters.text) &&
				card.races?.includes(Race[Race.ALL])) ||
			card.rarity?.toLowerCase().includes(searchFilters.text) ||
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
	readonly numberOfBuckets: number;
}

interface SearchFilters {
	readonly class: string;
	readonly text: string;
	readonly bucket: 'none';
}

export interface BucketData {
	readonly bucketId: string;
	readonly bucketName: string;
	readonly bucketClasses: readonly BucketClass[];
	readonly bucketCards: readonly BucketCard[];
	readonly bucketCardIds: readonly string[];
}

export interface BucketClass {
	readonly class: CardClass;
	readonly name: string;
	readonly image: string;
}

interface ReferenceCardWithBucket extends ReferenceCard {
	readonly numberOfBuckets: number;
}
