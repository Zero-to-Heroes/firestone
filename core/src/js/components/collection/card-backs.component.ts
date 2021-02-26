import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	ViewRef,
} from '@angular/core';
import { orderBy } from 'lodash';
import { IOption } from 'ng-select';
import { CardBack } from '../../models/card-back';
import { NavigationCollection } from '../../models/mainwindow/navigation/navigation-collection';
import { ShowCardBackDetailsEvent } from '../../services/mainwindow/store/events/collection/show-card-back-details-event';
import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../services/overwolf.service';
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
			</div>
			<ul class="cards-list" scrollable>
				<card-back
					class="card-back"
					*ngFor="let cardBack of shownCardBacks; let i = index; trackBy: trackByCardId"
					[cardBack]="cardBack"
					(click)="showFullCardBack(cardBack)"
				>
				</card-back>
			</ul>
			<!-- TODO: empty state -->
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardBacksComponent implements AfterViewInit {
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

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private readonly ow: OverwolfService, private readonly cdr: ChangeDetectorRef) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
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

	private updateInfo() {
		if (!this._cardBacks) {
			return;
		}

		this.shownCardBacks = this._cardBacks.filter(this.filterCardsOwned()).map(cardBack => ({
			...cardBack,
			image: `https://static.zerotoheroes.com/hearthstone/cardBacks/${cardBack.id}.png`,
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
				console.log('unknown filter', this.cardsOwnedActiveFilter);
				return (card: CardBack) => true;
		}
	}
}
