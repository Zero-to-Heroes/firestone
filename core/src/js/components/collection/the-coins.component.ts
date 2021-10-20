import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	HostListener,
	Input,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { sortBy } from 'lodash';
import { IOption } from 'ng-select';
import { BehaviorSubject, Subscription } from 'rxjs';
import { CardBack } from '../../models/card-back';
import { NavigationCollection } from '../../models/mainwindow/navigation/navigation-collection';
import { Preferences } from '../../models/preferences';
import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../services/overwolf.service';
import { PreferencesService } from '../../services/preferences.service';
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
export class TheCoinsComponent implements AfterViewInit, OnDestroy {
	readonly DEFAULT_CARD_WIDTH = 155;
	readonly DEFAULT_CARD_HEIGHT = 240;

	cardWidth = this.DEFAULT_CARD_WIDTH;
	cardHeight = this.DEFAULT_CARD_HEIGHT;

	cardsOwnedActiveFilter: 'own' | 'dontown' | 'all';

	@Input() set coins(value: readonly CollectionReferenceCard[]) {
		this._cards = sortBy(value, 'dbfId');
		this.updateInfo();
	}

	@Input() set navigation(value: NavigationCollection) {
		this._navigation = value;
		this.updateInfo();
	}

	_cards: readonly CollectionReferenceCard[];
	shownCards: readonly CollectionReferenceCard[];
	_navigation: NavigationCollection;
	unlocked: number;
	total: number;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;
	private preferencesSubscription: Subscription;

	constructor(
		private readonly ow: OverwolfService,
		private readonly prefs: PreferencesService,
		private readonly cdr: ChangeDetectorRef,
	) {}

	async ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
		const preferencesEventBus: BehaviorSubject<any> = this.ow.getMainWindow().preferencesEventBus;
		this.preferencesSubscription = preferencesEventBus.subscribe((event) => {
			this.handleDisplayPreferences(event.preferences);
		});
		await this.handleDisplayPreferences();
	}

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		this.preferencesSubscription?.unsubscribe();
	}

	selectCardsOwnedFilter(option: IOption) {
		this.cardsOwnedActiveFilter = option.value as any;
		this.updateInfo();
	}

	// showFullHeroPortrait(heroPortrait: CollectionReferenceCard) {
	// 	this.stateUpdater.next(new ShowCardDetailsEvent(heroPortrait.id));
	// }

	trackByCardId(card: CardBack, index: number) {
		return card.id;
	}

	private async handleDisplayPreferences(preferences: Preferences = null) {
		preferences = preferences || (await this.prefs.getPreferences());
		const cardScale = preferences.collectionCardScale / 100;
		this.cardWidth = cardScale * this.DEFAULT_CARD_WIDTH;
		this.cardHeight = cardScale * this.DEFAULT_CARD_HEIGHT;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
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
