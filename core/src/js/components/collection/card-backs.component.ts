import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { sortBy } from 'lodash';
import { IOption } from 'ng-select';
import { CardBack } from '../../models/card-back';
import { NavigationCollection } from '../../models/mainwindow/navigation/navigation-collection';

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
				<li
					class="card-back"
					*ngFor="let cardBack of shownCardBacks; let i = index; trackBy: trackByCardId"
					[ngClass]="{ 'missing': !cardBack.owned }"
				>
					<img [src]="cardBack.image" />
				</li>
			</ul>
			<!-- TODO: empty state -->
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardBacksComponent {
	cardsOwnedActiveFilter: 'own' | 'dontown' | 'all';

	@Input() set cardBacks(cardBacks: readonly CardBack[]) {
		this._cardBacks = sortBy(cardBacks, 'id');
		this.updateInfo();
	}

	@Input() set navigation(value: NavigationCollection) {
		this._navigation = value;
		this.updateInfo();
	}

	_cardBacks: readonly CardBack[];
	shownCardBacks: readonly InternalCardBack[];
	_navigation: NavigationCollection;

	constructor(private readonly cdr: ChangeDetectorRef) {}

	selectCardsOwnedFilter(option: IOption) {
		this.cardsOwnedActiveFilter = option.value as any;
		this.updateInfo();
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

interface InternalCardBack extends CardBack {
	image: string;
}
