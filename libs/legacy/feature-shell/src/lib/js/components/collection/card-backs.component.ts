import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { IOption } from 'ng-select';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { CardBack } from '../../models/card-back';
import { ShowCardBackDetailsEvent } from '../../services/mainwindow/store/events/collection/show-card-back-details-event';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../abstract-subscription-store.component';
import { InternalCardBack } from './internal-card-back';

@Component({
	selector: 'card-backs',
	styleUrls: [`../../../css/component/collection/card-backs.component.scss`],
	template: `
		<div class="card-backs" *ngIf="{ shownCardBacks: shownCardBacks$ | async } as value">
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
			<ul class="cards-list" *ngIf="!!value.shownCardBacks?.length" scrollable>
				<ng-container *ngIf="{ animated: animated$ | async } as value2">
					<card-back
						class="card-back"
						*ngFor="let cardBack of value.shownCardBacks; let i = index; trackBy: trackByCardId"
						[cardBack]="cardBack"
						[animated]="value2.animated"
						[style.width.px]="cardWidth"
						(click)="showFullCardBack(cardBack)"
					>
					</card-back>
				</ng-container>
			</ul>
			<collection-empty-state *ngIf="!value.shownCardBacks?.length"> </collection-empty-state>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardBacksComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	readonly DEFAULT_CARD_WIDTH = 139;

	animated$: Observable<boolean>;
	shownCardBacks$: Observable<readonly InternalCardBack[]>;
	unlocked$: Observable<number>;
	total$: Observable<number>;

	cardsOwnedActiveFilter$$ = new BehaviorSubject<'own' | 'dontown' | 'all'>('all');

	cardWidth = this.DEFAULT_CARD_WIDTH;

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		this.animated$ = this.listenForBasicPref$((prefs) => prefs.collectionUseAnimatedCardBacks);
		this.store
			.listenPrefs$((prefs) => prefs.collectionCardScale)
			.pipe(this.mapData(([pref]) => pref))
			.subscribe((value) => {
				const cardScale = value / 100;
				this.cardWidth = cardScale * this.DEFAULT_CARD_WIDTH;
				if (!(this.cdr as ViewRef)?.destroyed) {
					this.cdr.detectChanges();
				}
			});
		const cardBacks$ = this.store.cardBacks$().pipe(this.mapData((cardBacks) => cardBacks));
		this.total$ = cardBacks$.pipe(this.mapData((cardBacks) => cardBacks?.length ?? 0));
		this.unlocked$ = cardBacks$.pipe(
			this.mapData((cardBacks) => cardBacks?.filter((item) => item.owned).length ?? 0),
		);
		this.shownCardBacks$ = combineLatest(this.cardsOwnedActiveFilter$$.asObservable(), cardBacks$).pipe(
			this.mapData(([filter, cardBacks]) =>
				cardBacks?.filter(this.filterCardsOwned(filter)).map((cardBack) => ({
					...cardBack,
					image: `https://static.firestoneapp.com/cardbacks/512/${cardBack.id}.png`,
					// animatedImage: `https://static.zerotoheroes.com/hearthstone/cardBacks/animated/${cardBack.id}.webm`,
					animatedImage: null,
				})),
			),
		);
	}

	selectCardsOwnedFilter(option: IOption) {
		this.cardsOwnedActiveFilter$$.next(option.value as any);
	}

	showFullCardBack(cardBack: CardBack) {
		this.store.send(new ShowCardBackDetailsEvent(cardBack.id));
	}

	trackByCardId(index: number, card: CardBack) {
		return card.id;
	}

	private filterCardsOwned(cardsOwnedActiveFilter: 'own' | 'dontown' | 'all') {
		switch (cardsOwnedActiveFilter) {
			case 'own':
				return (card: CardBack) => card.owned;
			case 'dontown':
				return (card: CardBack) => !card.owned;
			case 'all':
				return (card: CardBack) => true;
			default:
				console.warn('unknown filter', cardsOwnedActiveFilter);
				return (card: CardBack) => true;
		}
	}
}
