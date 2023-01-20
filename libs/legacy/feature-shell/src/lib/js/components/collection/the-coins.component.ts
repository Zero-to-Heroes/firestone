import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { IOption } from 'ng-select';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { Coin } from '../../models/coin';
import { CardsFacadeService } from '../../services/cards-facade.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../abstract-subscription-store.component';
import { CollectionReferenceCard } from './collection-reference-card';

@Component({
	selector: 'the-coins',
	styleUrls: [`../../../css/component/collection/the-coins.component.scss`],
	template: `
		<div class="the-coins">
			<div class="show-filter">
				<collection-owned-filter
					class="owned-filter"
					(onOptionSelected)="selectCardsOwnedFilter($event)"
				></collection-owned-filter>
				<progress-bar
					class="progress-bar"
					[current]="unlocked$ | async"
					[total]="total$ | async"
				></progress-bar>
			</div>
			<ng-container *ngIf="{ shownCards: shownCards$ | async } as value">
				<ul class="cards-list" *ngIf="!!value.shownCards?.length" scrollable>
					<card-view
						class="card"
						*ngFor="let card of value.shownCards; let i = index; trackBy: trackByCardId"
						[collectionCard]="card"
						[showCounts]="false"
						[style.width.px]="cardWidth"
						[style.height.px]="cardHeight"
					>
					</card-view>
				</ul>
				<collection-empty-state *ngIf="!value.shownCards?.length"> </collection-empty-state>
			</ng-container>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TheCoinsComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	readonly DEFAULT_CARD_WIDTH = 185;
	readonly DEFAULT_CARD_HEIGHT = 240;

	shownCards$: Observable<readonly CollectionReferenceCard[]>;
	unlocked$: Observable<number>;
	total$: Observable<number>;

	cardWidth = this.DEFAULT_CARD_WIDTH;
	cardHeight = this.DEFAULT_CARD_HEIGHT;

	cardsOwnedActiveFilter$$ = new BehaviorSubject<'own' | 'dontown' | 'all'>('all');

	constructor(
		private readonly allCards: CardsFacadeService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		this.store
			.listenPrefs$((prefs) => prefs.collectionCardScale)
			.pipe(this.mapData(([pref]) => pref))
			.subscribe((value) => {
				const cardScale = value / 100;
				this.cardWidth = cardScale * this.DEFAULT_CARD_WIDTH;
				this.cardHeight = cardScale * this.DEFAULT_CARD_HEIGHT;
				if (!(this.cdr as ViewRef)?.destroyed) {
					this.cdr.detectChanges();
				}
			});
		const coins$ = this.store
			.listen$(([main, nav, prefs]) => main.binder.coins)
			.pipe(this.mapData(([coins]) => this.buildCoins(coins)));
		this.total$ = coins$.pipe(this.mapData((coins) => coins.length));
		this.unlocked$ = coins$.pipe(this.mapData((coins) => coins.filter((item) => item.numberOwned > 0).length));
		this.shownCards$ = combineLatest(this.cardsOwnedActiveFilter$$.asObservable(), coins$).pipe(
			this.mapData(([filter, coins]) => coins.filter(this.filterCardsOwned(filter))),
		);
	}

	private buildCoins(coins: readonly Coin[]): readonly CollectionReferenceCard[] {
		return coins
			.map((coin) => {
				const refCoin = this.allCards.getCard(coin.cardId);
				return {
					...refCoin,
					numberOwned: coin.owned ? 1 : 0,
				};
			})
			.sort((a, b) => a.dbfId - b.dbfId);
	}

	selectCardsOwnedFilter(option: IOption) {
		this.cardsOwnedActiveFilter$$.next(option.value as any);
	}

	trackByCardId(index: number, card: CollectionReferenceCard) {
		return card.id;
	}

	private filterCardsOwned(cardsOwnedActiveFilter: 'own' | 'dontown' | 'all') {
		switch (cardsOwnedActiveFilter) {
			case 'own':
				return (card: CollectionReferenceCard) => card.numberOwned > 0;
			case 'dontown':
				return (card: CollectionReferenceCard) => !card.numberOwned;
			case 'all':
				return (card: CollectionReferenceCard) => true;
			default:
				console.warn('unknown filter', this.cardsOwnedActiveFilter$$);
				return (card: CollectionReferenceCard) => true;
		}
	}
}
