import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { orderBy } from 'lodash';
import { IOption } from 'ng-select';
import { Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, takeUntil, tap } from 'rxjs/operators';
import { CardBack } from '../../models/card-back';
import { NavigationCollection } from '../../models/mainwindow/navigation/navigation-collection';
import { ShowCardBackDetailsEvent } from '../../services/mainwindow/store/events/collection/show-card-back-details-event';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { cdLog } from '../../services/ui-store/app-ui-store.service';
import { AbstractSubscriptionComponent } from '../abstract-subscription.component';
import { InternalCardBack } from './internal-card-back';

@Component({
	selector: 'card-backs',
	styleUrls: [`../../../css/global/scrollbar.scss`, `../../../css/component/collection/card-backs.component.scss`],
	template: `
		<div class="card-backs">
			<div class="show-filter">
				<collection-owned-filter
					class="owned-filter"
					(onOptionSelected)="selectCardsOwnedFilter($event)"
				></collection-owned-filter>
				<progress-bar class="progress-bar" [current]="unlocked" [total]="total"></progress-bar>
			</div>
			<ul class="cards-list" *ngIf="shownCardBacks?.length" scrollable>
				<ng-container *ngIf="{ animated: animated$ | async } as value">
					<card-back
						class="card-back"
						*ngFor="let cardBack of shownCardBacks; let i = index; trackBy: trackByCardId"
						[cardBack]="cardBack"
						[animated]="value.animated"
						[style.width.px]="cardWidth"
						(click)="showFullCardBack(cardBack)"
					>
					</card-back>
				</ng-container>
			</ul>
			<collection-empty-state *ngIf="!shownCardBacks?.length"> </collection-empty-state>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardBacksComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	readonly DEFAULT_CARD_WIDTH = 139;

	animated$: Observable<boolean>;
	cardWidth = this.DEFAULT_CARD_WIDTH;

	cardsOwnedActiveFilter: 'own' | 'dontown' | 'all';

	@Input() set cardBacks(cardBacks: readonly CardBack[]) {
		this._cardBacks = orderBy(cardBacks, 'id', 'desc');
		this.updateInfo();
	}

	@Input() set navigation(value: NavigationCollection) {
		this._navigation = value;
		this.updateInfo();
	}

	_cardBacks: readonly CardBack[];
	shownCardBacks: readonly InternalCardBack[];
	_navigation: NavigationCollection;
	unlocked: number;
	total: number;

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		this.animated$ = this.listenForBasicPref$((prefs) => prefs.collectionUseAnimatedCardBacks);
		this.store
			.listenPrefs$((prefs) => prefs.collectionCardScale)
			.pipe(
				debounceTime(100),
				map(([pref]) => pref),
				distinctUntilChanged(),
				tap((filter) => setTimeout(() => this.cdr?.detectChanges(), 0)),
				tap((filter) => cdLog('emitting pref in ', this.constructor.name, filter)),
				takeUntil(this.destroyed$),
			)
			.subscribe((value) => {
				const cardScale = value / 100;
				this.cardWidth = cardScale * this.DEFAULT_CARD_WIDTH;
				if (!(this.cdr as ViewRef)?.destroyed) {
					this.cdr.detectChanges();
				}
			});
	}

	selectCardsOwnedFilter(option: IOption) {
		this.cardsOwnedActiveFilter = option.value as any;
		this.updateInfo();
	}

	showFullCardBack(cardBack: CardBack) {
		this.store.send(new ShowCardBackDetailsEvent(cardBack.id));
	}

	trackByCardId(card: CardBack, index: number) {
		return card.id;
	}

	private updateInfo() {
		if (!this._cardBacks) {
			return;
		}

		this.total = this._cardBacks.length;
		this.unlocked = this._cardBacks.filter((item) => item.owned).length;

		this.shownCardBacks = this._cardBacks.filter(this.filterCardsOwned()).map((cardBack) => ({
			...cardBack,
			image: `https://static.firestoneapp.com/cardbacks/512/${cardBack.id}.png?v=2`,
			animatedImage: `https://static.zerotoheroes.com/hearthstone/cardBacks/animated/${cardBack.id}.webm`,
		}));
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr?.detectChanges();
		}
	}

	private filterCardsOwned() {
		switch (this.cardsOwnedActiveFilter) {
			case 'own':
				return (card: CardBack) => card.owned;
			case 'dontown':
				return (card: CardBack) => !card.owned;
			case 'all':
				return (card: CardBack) => true;
			default:
				console.warn('unknown filter', this.cardsOwnedActiveFilter);
				return (card: CardBack) => true;
		}
	}
}
