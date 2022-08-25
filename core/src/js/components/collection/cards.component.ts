import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import {
	CollectionCardClassFilterType,
	CollectionCardOwnedFilterType,
	CollectionCardRarityFilterType,
} from '@models/collection/filter-types';
import { sortBy } from 'lodash';
import { combineLatest, Observable } from 'rxjs';
import { Card } from '../../models/card';
import { Set, SetCard } from '../../models/set';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../abstract-subscription.component';

export const DEFAULT_CARD_WIDTH = 170;
export const DEFAULT_CARD_HEIGHT = 240;

@Component({
	selector: 'cards',
	styleUrls: [`../../../css/component/collection/cards.component.scss`, `../../../css/global/scrollbar.scss`],
	template: `
		<div class="cards">
			<div class="show-filter">
				<card-rarity-filter></card-rarity-filter>
				<card-class-filter></card-class-filter>
				<card-owned-filter></card-owned-filter>
			</div>

			<ng-container *ngIf="{ highRes: highRes$ | async } as value">
				<virtual-scroller
					#scroll
					*ngIf="cards$ | async as activeCards; else emptyState"
					[items]="activeCards"
					bufferAmount="5"
					class="cards-list"
					scrollable
				>
					<li
						*ngFor="let card of scroll.viewPortItems; trackBy: trackByCardId"
						class="card-container"
						[style.width.px]="cardWidth"
						[style.height.px]="cardHeight"
					>
						<card-view [card]="card" [highRes]="value.highRes" [showCounts]="true">/</card-view>
					</li>
				</virtual-scroller>
			</ng-container>

			<ng-template #emptyState>
				<collection-empty-state
					[set]="_set"
					[activeFilter]="cardsOwnedActiveFilter"
					[searchString]="_searchString"
				>
				</collection-empty-state>
			</ng-template>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardsComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	highRes$: Observable<boolean>;
	cards$: Observable<readonly SetCard[]>;

	_searchString: string;
	_cardList: SetCard[];
	_set: Set;

	cardWidth = DEFAULT_CARD_WIDTH;
	cardHeight = DEFAULT_CARD_HEIGHT;

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
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

		this.cards$ = combineLatest(
			this.store.listen$(([main, nav, prefs]) => nav.navigationCollection.cardList),
			this.store.listenPrefs$(
				(prefs) => prefs.collectionCardClassFilter,
				(prefs) => prefs.collectionCardRarityFilter,
				(prefs) => prefs.collectionCardOwnedFilter,
			),
		).pipe(
			this.mapData(([[cardList], [classFilter, rarityFilter, ownedFilter]]) => {
				const filteredCards = cardList
					.filter((card) => this.filterRarity(card, rarityFilter))
					.filter((card) => this.filterClass(card, classFilter))
					.filter((card) => this.filterCardsOwned(card, ownedFilter));
				const sortedCards = sortBy(filteredCards, 'cost', 'name');
				console.debug('sortedCards', sortedCards);
				return sortedCards;
			}),
		);
	}

	@Input('set') set cardSet(set: Set) {
		this._set = set;
	}

	@Input('searchString') set searchString(searchString: string) {
		this._searchString = searchString;
	}

	trackByCardId(index: number, card: Card) {
		return card.id;
	}

	private filterRarity(card: SetCard, filter: CollectionCardRarityFilterType): boolean {
		switch (filter) {
			case 'all':
				return true;
			default:
				return card.rarity && card.rarity?.toLowerCase() === filter;
		}
	}

	private filterClass(card: SetCard, filter: CollectionCardClassFilterType): boolean {
		switch (filter) {
			case 'all':
				return true;
			default:
				return card.cardClass && card.cardClass?.toLowerCase() === filter;
		}
	}

	private filterCardsOwned(card: SetCard, filter: CollectionCardOwnedFilterType): boolean {
		switch (filter) {
			case 'all':
				return true;
			case 'own':
				return card.ownedNonPremium + card.ownedPremium + card.ownedDiamond > 0;
			case 'missingplayablecopies':
				return card.ownedNonPremium + card.ownedPremium + card.ownedDiamond < card.getMaxCollectible();
			case 'goldenown':
				return card.ownedPremium + card.ownedDiamond > 0;
			case 'notpremiumnotcompleted':
				return card.ownedNonPremium < card.getMaxCollectible();
			case 'notcompleted':
				return (
					card.ownedPremium + card.ownedDiamond < card.getMaxCollectible() ||
					card.ownedNonPremium < card.getMaxCollectible()
				);
			case 'dontown':
				return card.ownedNonPremium + card.ownedPremium + card.ownedDiamond === 0;
			default:
				console.warn('unknown filter', filter);
		}
	}
}
