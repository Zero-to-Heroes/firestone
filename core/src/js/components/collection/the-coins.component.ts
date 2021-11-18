import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { sortBy } from 'lodash';
import { IOption } from 'ng-select';
import { debounceTime, distinctUntilChanged, map, takeUntil, tap } from 'rxjs/operators';
import { CardBack } from '../../models/card-back';
import { NavigationCollection } from '../../models/mainwindow/navigation/navigation-collection';
import { OverwolfService } from '../../services/overwolf.service';
import { PreferencesService } from '../../services/preferences.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { cdLog } from '../../services/ui-store/app-ui-store.service';
import { AbstractSubscriptionComponent } from '../abstract-subscription.component';
import { CollectionReferenceCard } from './collection-reference-card';

@Component({
	selector: 'the-coins',
	styleUrls: [`../../../css/global/scrollbar.scss`, `../../../css/component/collection/the-coins.component.scss`],
	template: `
		<div class="the-coins">
			<div class="show-filter">
				<collection-owned-filter
					class="owned-filter"
					(onOptionSelected)="selectCardsOwnedFilter($event)"
				></collection-owned-filter>
				<progress-bar class="progress-bar" [current]="unlocked" [total]="total"></progress-bar>
			</div>
			<ul class="cards-list" *ngIf="shownCards?.length" scrollable>
				<card-view
					class="card"
					*ngFor="let card of shownCards; let i = index; trackBy: trackByCardId"
					[collectionCard]="card"
					[showCounts]="false"
					[style.width.px]="cardWidth"
					[style.height.px]="cardHeight"
				>
				</card-view>
			</ul>
			<collection-empty-state *ngIf="!shownCards?.length"> </collection-empty-state>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TheCoinsComponent extends AbstractSubscriptionComponent implements AfterViewInit {
	readonly DEFAULT_CARD_WIDTH = 185;
	readonly DEFAULT_CARD_HEIGHT = 240;

	@Input() set coins(value: readonly CollectionReferenceCard[]) {
		this._cards = sortBy(value, 'dbfId');
		this.updateInfo();
	}
	@Input() set navigation(value: NavigationCollection) {
		this._navigation = value;
		this.updateInfo();
	}

	cardWidth = this.DEFAULT_CARD_WIDTH;
	cardHeight = this.DEFAULT_CARD_HEIGHT;

	cardsOwnedActiveFilter: 'own' | 'dontown' | 'all';

	_cards: readonly CollectionReferenceCard[];
	shownCards: readonly CollectionReferenceCard[];
	_navigation: NavigationCollection;
	unlocked: number;
	total: number;

	constructor(
		private readonly ow: OverwolfService,
		private readonly prefs: PreferencesService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	async ngAfterViewInit() {
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
				this.cardHeight = cardScale * this.DEFAULT_CARD_HEIGHT;
				if (!(this.cdr as ViewRef)?.destroyed) {
					this.cdr.detectChanges();
				}
			});
	}

	selectCardsOwnedFilter(option: IOption) {
		this.cardsOwnedActiveFilter = option.value as any;
		this.updateInfo();
	}

	trackByCardId(card: CardBack, index: number) {
		return card.id;
	}

	private updateInfo() {
		if (!this._cards) {
			return;
		}

		this.total = this._cards.length;
		this.unlocked = this._cards.filter((item) => item.numberOwned > 0).length;
		this.shownCards = this._cards.filter(this.filterCardsOwned());
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private filterCardsOwned() {
		switch (this.cardsOwnedActiveFilter) {
			case 'own':
				return (card: CollectionReferenceCard) => card.numberOwned > 0;
			case 'dontown':
				return (card: CollectionReferenceCard) => !card.numberOwned;
			case 'all':
				return (card: CollectionReferenceCard) => true;
			default:
				console.warn('unknown filter', this.cardsOwnedActiveFilter);
				return (card: CollectionReferenceCard) => true;
		}
	}
}
