import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { FormControl } from '@angular/forms';
import { CardType, ReferenceCard } from '@firestone-hs/reference-data';
import { VisualDeckCard } from '@models/decktracker/visual-deck-card';
import { CardsFacadeService } from '@services/cards-facade.service';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { sortByProperties } from '@services/utils';
import { BehaviorSubject, combineLatest, from, Observable } from 'rxjs';
import { startWith } from 'rxjs/operators';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';

export const DEFAULT_CARD_WIDTH = 170;
export const DEFAULT_CARD_HEIGHT = 221;
@Component({
	selector: 'duels-deckbuilder',
	styleUrls: [`../../../../css/component/duels/desktop/duels-deckbuilder.component.scss`],
	template: `
		<div class="duels-deckbuilder">
			<!-- First intermediate screen where you select Hero, Hero Power and Signature Treasure  -->
			<!-- Once these are selected, you're brought to the builder proper -->
			<!-- Header should recap this info, add a way to discard the current deck -->
			<!-- Arena to the right should recap the mana curve and maybe other stats -->
			<!-- Need an area to at least search for cards or browse them all by class. Add at least 
			search keywords (like cost:2+ or school:fire) to avoid having too many icons, at least 
			at the beginning -->
			<!-- Need a way to see the buckets that will be offered with the current cards selection -->
			<!-- Need a way to import a deck code -->
			<!-- Need a way to use only your own collection -->
			<!-- Abillity to click on a card in the tracker and automatically filter the cards that synergize with it? -->
			<!-- Don't forget to only include the sets that are allowed in Duels -->
			<!-- Remove banned cards -->
			<!-- Filter by collection? -->

			<ng-container *ngIf="{ activeCards: activeCards$ | async } as value">
				<div class="decklist-container">
					<div class="card-search">
						<label class="search-label">
							<div
								class="icon"
								inlineSVG="assets/svg/search.svg"
								[helpTooltip]="searchShortcutsTooltip"
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
				</div>
				<div class="results-container">
					<div class="menu"></div>
					<div class="results">
						<virtual-scroller #scroll [items]="value.activeCards" bufferAmount="5" scrollable>
							<div
								*ngFor="let card of scroll.viewPortItems; trackBy: trackByCardId"
								class="card-container"
								[style.width.px]="cardWidth"
								[style.height.px]="cardHeight"
							>
								<div class="card">
									<img *ngIf="card.imagePath" [src]="card.imagePath" class="real-card" />
								</div>
							</div>
						</virtual-scroller>
					</div>
				</div>
			</ng-container>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsDeckbuilderComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	currentDeckCards$: Observable<readonly string[]>;
	activeCards$: Observable<readonly DeckBuilderCard[]>;
	highRes$: Observable<boolean>;

	cardWidth: number;
	cardHeight: number;
	searchForm = new FormControl();

	searchShortcutsTooltip: string;

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
		console.debug('azftr');
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
		const allCards$ = from([this.allCards.getCards()]).pipe(
			this.mapData((cards) =>
				cards
					.filter((card) => card.collectible)
					.filter((card) => card.type?.toLowerCase() !== CardType[CardType.ENCHANTMENT].toLowerCase()),
			),
		);
		const collection$ = this.store
			.listen$(([main, nav]) => main.binder.collection)
			.pipe(this.mapData(([collection]) => collection));

		const searchString$ = this.searchForm.valueChanges.pipe(
			startWith(null),
			this.mapData((data: string) => data?.toLowerCase(), null, 50),
		);
		this.activeCards$ = combineLatest(allCards$, collection$, searchString$, this.highRes$).pipe(
			this.mapData(
				([allCards, collection, searchString, highRes]) => {
					const searchFilters = this.extractSearchFilters(searchString);
					const searchResult = allCards
						.filter((card) => this.doesCardMatchSearchFilters(card, searchFilters))
						.sort(sortByProperties((card: ReferenceCard) => [card.cost, card.playerClass, card.name]))
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
		this.currentDeckCards$ = this.currentDeckCards.asObservable().pipe(
			this.mapData((cards) => {
				return cards;
			}),
		);

		this.searchShortcutsTooltip = `
			<div class="tooltip-container">
				You can use the following shortcuts to search:
				<ul class="shortcuts">
					<li>Enter: add the first result to your list</li>
					<li>Shift + Enter: add the first result to your list and clear the search box</li>
					<li>"class:<class>": search only cards from that class (eg "class:mage" or "class:neutral")</li>
				</ul>
			</div>
		`;
	}

	trackByCardId(index: number, item: DeckBuilderCard) {
		return item.cardId;
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

	private doesCardMatchSearchFilters(card: ReferenceCard, searchFilters: SearchFilters): boolean {
		if (!searchFilters) {
			return true;
		}

		if (searchFilters.class && !card.playerClass?.toLowerCase().includes(searchFilters.class)) {
			return false;
		}

		if (!searchFilters?.name?.length) {
			return true;
		}

		return card.name.toLowerCase().includes(searchFilters.name);
	}

	private extractSearchFilters(searchString: string): SearchFilters {
		if (!searchString?.length) {
			return null;
		}

		const result: SearchFilters = {} as SearchFilters;

		const fragments = searchString.split(' ');
		const searchTerms: string[] = [];

		for (const fragment of fragments) {
			console.debug('fragment', fragment);
			const classSearch = fragment.match(/class:([^\s]+)/);
			console.debug('classSearch', classSearch, fragment);
			const classArg = !!classSearch ? classSearch[1] : null;
			console.debug('classArg', classArg, classSearch);
			if (classArg?.length) {
				result.class = classArg.toLowerCase();
				continue;
			}

			searchTerms.push(fragment);
		}

		result.name = searchTerms.join(' ');
		console.debug('search filters', result, fragments);
		return result;
	}
}

interface DeckBuilderCard {
	readonly cardId: string;
	readonly name: string;
	readonly imagePath: string;
}

interface SearchFilters {
	class: string;
	name: string;
}
