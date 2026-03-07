import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { MainWindowStateFacadeService } from '@firestone/mainwindow/common';
import { CardBack } from '@firestone/memory';
import { PictureAnimatedToggleType, PreferencesService } from '@firestone/shared/common/service';
import { IOption } from '@firestone/shared/common/view';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { CollectionManager } from '@firestone/collection/services';
import { ShowCardBackDetailsEvent } from '@firestone/mainwindow/common';
import { InternalCardBack } from './internal-card-back';

@Component({
	standalone: false,
	selector: 'card-backs',
	styleUrls: [`../../../css/component/collection/card-backs.component.scss`],
	template: `
		<div class="card-backs" *ngIf="{ shownCardBacks: shownCardBacks$ | async } as value">
			<div class="show-filter">
				<collection-owned-filter
					class="owned-filter"
					(onOptionSelected)="selectCardsOwnedFilter($event)"
				></collection-owned-filter>
				<card-back-animated-toggle class="animated-toggle"></card-back-animated-toggle>
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
						[animated]="value2.animated === 'animated' || value2.animated === 'animated-all'"
						[alwaysOn]="value2.animated === 'animated-all'"
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

	animated$: Observable<PictureAnimatedToggleType>;
	shownCardBacks$: Observable<readonly InternalCardBack[]>;
	unlocked$: Observable<number>;
	total$: Observable<number>;

	cardsOwnedActiveFilter$$ = new BehaviorSubject<'own' | 'dontown' | 'all'>('all');

	cardWidth = this.DEFAULT_CARD_WIDTH;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly prefs: PreferencesService,
		private readonly collectionManager: CollectionManager,
		private readonly mainWindowStateFacade: MainWindowStateFacadeService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs, this.collectionManager, this.mainWindowStateFacade);

		this.animated$ = this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.cardBackAnimatedToggle));
		this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.collectionCardScale)).subscribe((value) => {
			const cardScale = value / 100;
			this.cardWidth = cardScale * this.DEFAULT_CARD_WIDTH;
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.markForCheck();
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
					animatedImage: `https://static.firestoneapp.com/cardbacks/512/${cardBack.id}.webm`,
				})),
			),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}

	selectCardsOwnedFilter(option: IOption) {
		this.cardsOwnedActiveFilter$$.next(option.value as any);
	}

	showFullCardBack(cardBack: CardBack) {
		this.mainWindowStateFacade.send(new ShowCardBackDetailsEvent(cardBack.id));
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
