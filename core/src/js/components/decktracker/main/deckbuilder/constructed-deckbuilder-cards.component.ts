import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { FormControl } from '@angular/forms';
import { CardClass, CardIds, CardType, GameFormat, ReferenceCard } from '@firestone-hs/reference-data';
import { VisualDeckCard } from '@models/decktracker/visual-deck-card';
import { CardsFacadeService } from '@services/cards-facade.service';
import { dustToCraftFor, getDefaultHeroDbfIdForClass } from '@services/hs-utils';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { groupByFunction, sortByProperties } from '@services/utils';
import { DeckDefinition, encode } from 'deckstrings';
import { BehaviorSubject, combineLatest, from, Observable } from 'rxjs';
import { startWith } from 'rxjs/operators';
import { SetCard } from '../../../../models/set';
import { ConstructedDeckbuilderSaveDeckEvent } from '../../../../services/mainwindow/store/events/decktracker/constructed-deckbuilder-save-deck-event';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../../abstract-subscription.component';

export const DEFAULT_CARD_WIDTH = 170;
export const DEFAULT_CARD_HEIGHT = 221;
@Component({
	selector: 'constructed-deckbuilder-cards',
	styleUrls: [
		`../../../../../css/component/decktracker/main/deckbuilder/constructed-deckbuilder-cards.component.scss`,
	],
	template: `
		<div class="constructed-deckbuilder-cards">
			<div class="deck-rename-container">
				<input class="name-input" [(ngModel)]="deckName" (mousedown)="preventDrag($event)" />
			</div>
			<ng-container
				*ngIf="{
					allowedCards: allowedCards$ | async,
					activeCards: activeCards$ | async,
					showRelatedCards: showRelatedCards$ | async
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
								[autofocus]="true"
							/>
						</label>
					</div>
					<deck-list
						class="deck-list"
						[cards]="currentDeckCards$ | async"
						(cardClicked)="onDecklistCardClicked($event)"
						[collection]="collection$ | async"
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
					<div class="results">
						<virtual-scroller
							class="cards-container"
							#scroll
							*ngIf="value.activeCards?.length; else emptyState"
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
										[cardTooltipShowRelatedCards]="value.showRelatedCards"
										class="real-card"
										(click)="addCard(card)"
									/>
								</div>
							</div>
						</virtual-scroller>
						<ng-template #emptyState>
							<collection-empty-state [searchString]="searchString$ | async"> </collection-empty-state>
						</ng-template>
					</div>
				</div>
			</ng-container>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConstructedDeckbuilderCardsComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	currentDeckCards$: Observable<readonly string[]>;
	activeCards$: Observable<readonly DeckBuilderCard[]>;
	highRes$: Observable<boolean>;
	showRelatedCards$: Observable<boolean>;
	maxCardsInDeck$: Observable<number>;
	deckValid$: Observable<boolean>;
	deckstring$: Observable<string>;
	searchString$: Observable<string>;
	ongoingText$: Observable<string>;
	allowedCards$: Observable<ReferenceCard[]>;
	collection$: Observable<readonly SetCard[]>;
	missingDust$: Observable<number>;

	saveDeckcodeButtonLabel = this.i18n.translateString('app.duels.deckbuilder.save-deck-button');

	cardWidth: number;
	cardHeight: number;
	searchForm = new FormControl();

	searchShortcutsTooltip: string;
	deckName: string = this.i18n.translateString('decktracker.deck-name.unnamed-deck');

	private currentDeckCards = new BehaviorSubject<readonly string[]>([]);

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

		this.allowedCards$ = combineLatest(
			this.store.listen$(
				([main, nav]) => main.decktracker.config,
				([main, nav]) => main.decktracker.deckbuilder.currentFormat,
				([main, nav]) => main.decktracker.deckbuilder.currentClass,
			),
			from([this.allCards.getCards()]),
		).pipe(
			this.mapData(([[config, currentFormat, currentClass], cards]) => {
				currentClass = currentClass ?? CardClass[CardClass.NEUTRAL];
				const validSets =
					currentFormat === 'classic'
						? config.vanillaSets
						: currentFormat === 'standard'
						? config.standardSets
						: config.wildSets;
				const cardsWithDuplicates: readonly ReferenceCard[] = cards
					.filter((card) => card.collectible)
					.filter((card) => validSets.includes(card.set?.toLowerCase()))
					.filter((card) => {
						const searchCardClasses: readonly CardClass[] = [
							CardClass[currentClass.toUpperCase()],
							CardClass.NEUTRAL,
						];
						const cardCardClasses: readonly CardClass[] = card.classes
							? card.classes.map((c) => CardClass[c])
							: !!card.cardClass
							? [CardClass[card.cardClass]]
							: [];
						return searchCardClasses.some((c) => cardCardClasses.includes(c));
					})
					.filter((card) => card.type?.toLowerCase() !== CardType[CardType.ENCHANTMENT].toLowerCase());
				const groupedByName = groupByFunction((card: ReferenceCard) => card.name)(cardsWithDuplicates);
				const result = Object.values(groupedByName).map((cards) => {
					if (cards.length === 1) {
						return cards[0];
					}
					const allowed = cards.filter((c) => validSets.includes(c.set?.toLowerCase()));
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
				});
				return result;
			}),
		);
		this.collection$ = this.store
			.listen$(([main, nav]) => main.binder.allSets)
			.pipe(
				this.mapData(
					([allSets]) =>
						allSets.map((set) => set.allCards).reduce((a, b) => a.concat(b), []) as readonly SetCard[],
				),
			);

		this.searchString$ = this.searchForm.valueChanges.pipe(
			startWith(null),
			this.mapData((data: string) => data?.toLowerCase(), null, 50),
		);
		this.currentDeckCards$ = this.currentDeckCards.asObservable();
		this.activeCards$ = combineLatest(
			this.allowedCards$,
			this.collection$,
			this.searchString$,
			this.currentDeckCards$,
		).pipe(
			this.mapData(
				([allCards, collection, searchString, deckCards]) => {
					const searchFilters = this.extractSearchFilters(searchString);
					const searchResult = allCards
						.filter((card) => !this.hasMaximumCopies(card.id, deckCards))
						.filter((card) => this.doesCardMatchSearchFilters(card, searchFilters))
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
		this.maxCardsInDeck$ = this.currentDeckCards$.pipe(
			this.mapData((cards) => (cards?.includes(CardIds.PrinceRenathal) ? 40 : 30)),
		);

		this.deckValid$ = combineLatest(this.currentDeckCards$, this.maxCardsInDeck$).pipe(
			this.mapData(([cards, maxCards]) => {
				const groupedCards = groupByFunction((cardId: string) => cardId)(cards);
				return cards?.length === maxCards && Object.values(groupedCards).every((cards) => cards.length <= 2);
			}),
		);
		// Init cards if they already exist in the store (because of a deck import for instance)
		this.store
			.listen$(([main, nav]) => main.decktracker.deckbuilder.currentCards)
			.pipe(this.mapData(([cards]) => cards))
			.subscribe((cards) => this.currentDeckCards.next(cards));
		this.deckstring$ = combineLatest(
			this.currentDeckCards$,
			this.store.listen$(
				([main, nav]) => main.decktracker.deckbuilder.currentFormat,
				([main, nav]) => main.decktracker.deckbuilder.currentClass,
			),
		).pipe(
			this.mapData(([cards, [currentFormat, currentClass]]) => {
				const groupedCards = groupByFunction((cardId: string) => cardId)(cards);
				const cardDbfIds = Object.values(groupedCards).map(
					(cards) => [this.allCards.getCard(cards[0]).dbfId, cards.length] as [number, number],
				);
				console.debug('getting default hero', currentClass);
				const heroDbfId = getDefaultHeroDbfIdForClass(currentClass);
				console.debug('heroDbfId', heroDbfId, currentClass);
				const deckDefinition: DeckDefinition = {
					format:
						currentFormat === 'classic'
							? GameFormat.FT_CLASSIC
							: currentFormat === 'standard'
							? GameFormat.FT_STANDARD
							: GameFormat.FT_WILD,
					cards: cardDbfIds,
					heroes: [heroDbfId],
				};
				const deckstring = encode(deckDefinition);
				return deckstring;
			}),
		);
		this.ongoingText$ = combineLatest(this.currentDeckCards$, this.maxCardsInDeck$).pipe(
			this.mapData(([cards, maxCards]) =>
				this.i18n.translateString('app.duels.deckbuilder.ongoing-deck-building', {
					currentCards: cards?.length ?? 0,
					maxCards: maxCards,
				}),
			),
		);
		this.missingDust$ = combineLatest(this.currentDeckCards$, this.collection$).pipe(
			this.mapData(([cards, collection]) => {
				const groupedByCardId = groupByFunction((cardId: string) => cardId)(cards);
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
				</ul>
			</div>
		`;
	}

	trackByCardId(index: number, item: DeckBuilderCard) {
		return item.cardId;
	}

	addCard(card: DeckBuilderCard) {
		console.debug('adding card', this.currentDeckCards.value);
		if (this.currentDeckCards.value?.includes(card.cardId)) {
			if (this.allCards.getCard(card.cardId).rarity === 'Legendary') {
				return;
			} else if (this.currentDeckCards.value.filter((c) => c === card.cardId).length >= 2) {
				return;
			}
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
			const card = activeCards[0];
			this.addCard(card);
			const hasMaxCopies =
				this.hasMaximumCopies(card.cardId, this.currentDeckCards.value) && activeCards.length === 1;
			if (event.shiftKey || hasMaxCopies) {
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
		this.store.send(new ConstructedDeckbuilderSaveDeckEvent(deckstring, this.deckName));
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

	preventDrag(event: MouseEvent) {
		event.stopPropagation();
	}

	private hasMaximumCopies(cardId: string, deckCards: readonly string[]): boolean {
		const numberOfCards = deckCards?.filter((c) => c === cardId).length ?? 0;
		if (numberOfCards === 1 && this.allCards.getCard(cardId).rarity === 'Legendary') {
			return true;
		} else if (numberOfCards >= 2) {
			return true;
		}
		return false;
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

	private doesCardMatchSearchFilters(card: ReferenceCard, searchFilters: SearchFilters): boolean {
		if (!searchFilters) {
			return true;
		}

		if (searchFilters.class && !card.playerClass?.toLowerCase().includes(searchFilters.class)) {
			return false;
		}

		return (
			!searchFilters?.text?.length ||
			card.name.toLowerCase().includes(searchFilters.text) ||
			card.text?.toLowerCase().includes(searchFilters.text) ||
			card.spellSchool?.toLowerCase().includes(searchFilters.text) ||
			card.race?.toLowerCase().includes(searchFilters.text) ||
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
}
