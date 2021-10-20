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
import { orderBy } from 'lodash';
import { IOption } from 'ng-select';
import { BehaviorSubject, Subscription } from 'rxjs';
import { CardBack } from '../../models/card-back';
import { NavigationCollection } from '../../models/mainwindow/navigation/navigation-collection';
import { Preferences } from '../../models/preferences';
import { ShowCardBackDetailsEvent } from '../../services/mainwindow/store/events/collection/show-card-back-details-event';
import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../services/overwolf.service';
import { PreferencesService } from '../../services/preferences.service';
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
				<card-back
					class="card-back"
					*ngFor="let cardBack of shownCardBacks; let i = index; trackBy: trackByCardId"
					[cardBack]="cardBack"
					[animated]="animated"
					[style.width.px]="cardWidth"
					(click)="showFullCardBack(cardBack)"
				>
				</card-back>
			</ul>
			<collection-empty-state *ngIf="!shownCardBacks?.length"> </collection-empty-state>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardBacksComponent implements AfterViewInit, OnDestroy {
	readonly DEFAULT_CARD_WIDTH = 139;

	cardWidth = this.DEFAULT_CARD_WIDTH;
	animated = false;

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

	showFullCardBack(cardBack: CardBack) {
		this.stateUpdater.next(new ShowCardBackDetailsEvent(cardBack.id));
	}

	trackByCardId(card: CardBack, index: number) {
		return card.id;
	}

	private async handleDisplayPreferences(preferences: Preferences = null) {
		preferences = preferences || (await this.prefs.getPreferences());
		const cardScale = preferences.collectionCardScale / 100;
		this.cardWidth = cardScale * this.DEFAULT_CARD_WIDTH;
		this.animated = preferences.collectionUseAnimatedCardBacks;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private updateInfo() {
		if (!this._cardBacks) {
			return;
		}

		this.total = this._cardBacks.length;
		this.unlocked = this._cardBacks.filter((item) => item.owned).length;

		this.shownCardBacks = this._cardBacks.filter(this.filterCardsOwned()).map((cardBack) => ({
			...cardBack,
			image: `https://static.zerotoheroes.com/hearthstone/cardBacks/${cardBack.id}.png`,
			animatedImage: `https://static.zerotoheroes.com/hearthstone/cardBacks/animated/${cardBack.id}.webm`,
		}));
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
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
