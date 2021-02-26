import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	ViewRef,
} from '@angular/core';
import { sortBy } from 'lodash';
import { IOption } from 'ng-select';
import { CardBack } from '../../models/card-back';
import { NavigationCollection } from '../../models/mainwindow/navigation/navigation-collection';
import { ShowCardDetailsEvent } from '../../services/mainwindow/store/events/collection/show-card-details-event';
import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../services/overwolf.service';
import { CollectionReferenceCard } from './collection-reference-card';

@Component({
	selector: 'hero-portraits',
	styleUrls: [
		`../../../css/global/scrollbar.scss`,
		`../../../css/component/collection/hero-portraits.component.scss`,
	],
	template: `
		<div class="hero-portraits">
			<div class="show-filter">
				<collection-owned-filter
					class="owned-filter"
					(onOptionSelected)="selectCardsOwnedFilter($event)"
				></collection-owned-filter>
			</div>
			<ul class="cards-list" scrollable>
				<hero-portrait
					class="hero-portrait"
					*ngFor="let heroPortrait of shownHeroPortraits; let i = index; trackBy: trackByCardId"
					[heroPortrait]="heroPortrait"
					(click)="showFullHeroPortrait(heroPortrait)"
				>
				</hero-portrait>
			</ul>
			<!-- TODO: empty state -->
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroPortraitsComponent implements AfterViewInit {
	cardsOwnedActiveFilter: 'own' | 'dontown' | 'all';

	@Input() set heroPortraits(value: readonly CollectionReferenceCard[]) {
		this._heroPortraits = sortBy(value, 'id', 'playerClass');
		this.updateInfo();
	}

	@Input() set navigation(value: NavigationCollection) {
		this._navigation = value;
		this.updateInfo();
	}

	_heroPortraits: readonly CollectionReferenceCard[];
	shownHeroPortraits: readonly CollectionReferenceCard[];
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

	showFullHeroPortrait(heroPortrait: CollectionReferenceCard) {
		this.stateUpdater.next(new ShowCardDetailsEvent(heroPortrait.id));
	}

	trackByCardId(card: CardBack, index: number) {
		return card.id;
	}

	private updateInfo() {
		if (!this._heroPortraits) {
			return;
		}

		this.shownHeroPortraits = this._heroPortraits.filter(this.filterCardsOwned());
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
				console.log('unknown filter', this.cardsOwnedActiveFilter);
				return (card: CollectionReferenceCard) => true;
		}
	}
}
