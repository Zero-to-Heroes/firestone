import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	ViewRef,
} from '@angular/core';
import { CardBack } from '@firestone/memory';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { OverwolfService } from '@firestone/shared/framework/core';
import { IOption } from 'ng-select';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { CollectionManager } from '../../services/collection/collection-manager.service';
import { ShowCardBackDetailsEvent } from '../../services/mainwindow/store/events/collection/show-card-back-details-event';
import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';
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
export class CardBacksComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	readonly DEFAULT_CARD_WIDTH = 139;

	animated$: Observable<boolean>;
	shownCardBacks$: Observable<readonly InternalCardBack[]>;
	unlocked$: Observable<number>;
	total$: Observable<number>;

	cardsOwnedActiveFilter$$ = new BehaviorSubject<'own' | 'dontown' | 'all'>('all');

	cardWidth = this.DEFAULT_CARD_WIDTH;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly prefs: PreferencesService,
		private readonly collectionManager: CollectionManager,
		private readonly ow: OverwolfService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await Promise.all([this.prefs.isReady(), this.collectionManager.isReady()]);

		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;

		this.animated$ = this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.collectionUseAnimatedCardBacks));
		this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.collectionCardScale)).subscribe((value) => {
			const cardScale = value / 100;
			this.cardWidth = cardScale * this.DEFAULT_CARD_WIDTH;
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		});
		const cardBacks$ = this.collectionManager.cardBacks$$.pipe(this.mapData((cardBacks) => cardBacks));
		this.total$ = cardBacks$.pipe(this.mapData((cardBacks) => cardBacks?.length ?? 0));
		this.unlocked$ = cardBacks$.pipe(
			this.mapData((cardBacks) => cardBacks?.filter((item) => item.owned).length ?? 0),
		);
		this.shownCardBacks$ = combineLatest([this.cardsOwnedActiveFilter$$.asObservable(), cardBacks$]).pipe(
			this.mapData(([filter, cardBacks]) =>
				cardBacks?.filter(this.filterCardsOwned(filter)).map((cardBack) => ({
					...cardBack,
					image: `https://static.firestoneapp.com/cardbacks/512/${cardBack.id}.png`,
					// animatedImage: `https://static.zerotoheroes.com/hearthstone/cardBacks/animated/${cardBack.id}.webm`,
					animatedImage: null,
				})),
			),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	selectCardsOwnedFilter(option: IOption) {
		this.cardsOwnedActiveFilter$$.next(option.value as any);
	}

	showFullCardBack(cardBack: CardBack) {
		this.stateUpdater.next(new ShowCardBackDetailsEvent(cardBack.id));
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
