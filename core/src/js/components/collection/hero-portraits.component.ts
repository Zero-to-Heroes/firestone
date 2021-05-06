import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { sortBy } from 'lodash';
import { IOption } from 'ng-select';
import { Subscription } from 'rxjs';
import { CardBack } from '../../models/card-back';
import { NavigationCollection } from '../../models/mainwindow/navigation/navigation-collection';
import { Preferences } from '../../models/preferences';
import { formatClass } from '../../services/hs-utils';
import { ShowCardDetailsEvent } from '../../services/mainwindow/store/events/collection/show-card-details-event';
import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../services/overwolf.service';
import { PreferencesService } from '../../services/preferences.service';
import { groupByFunction } from '../../services/utils';
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
				<progress-bar class="progress-bar" [current]="unlocked" [total]="total"></progress-bar>
			</div>
			<ul class="cards-list" *ngIf="shownHeroPortraits?.length" scrollable>
				<div
					class="portraits-for-class"
					*ngFor="let portraitGroup of shownHeroPortraits; let i = index; trackBy: trackByTitle"
				>
					<div class="header">{{ portraitGroup.title }}</div>
					<div class="portraits-container">
						<hero-portrait
							class="hero-portrait"
							*ngFor="let heroPortrait of portraitGroup.portraits; let i = index; trackBy: trackByCardId"
							[heroPortrait]="heroPortrait"
							[style.width.px]="cardWidth"
							(click)="showFullHeroPortrait(heroPortrait)"
						>
						</hero-portrait>
					</div>
				</div>
			</ul>
			<collection-empty-state *ngIf="!shownHeroPortraits?.length"> </collection-empty-state>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroPortraitsComponent implements AfterViewInit, OnDestroy {
	readonly DEFAULT_CARD_WIDTH = 174;

	cardWidth = this.DEFAULT_CARD_WIDTH;

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
	shownHeroPortraits: readonly PortraitGroup[];
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
		const preferencesEventBus: EventEmitter<any> = this.ow.getMainWindow().preferencesEventBus;
		this.preferencesSubscription = preferencesEventBus.subscribe((event) => {
			this.handleDisplayPreferences(event.preferences);
		});
		await this.handleDisplayPreferences();
	}

	ngOnDestroy() {
		this.preferencesSubscription?.unsubscribe();
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

	private async handleDisplayPreferences(preferences: Preferences = null) {
		preferences = preferences || (await this.prefs.getPreferences());
		const cardScale = preferences.collectionCardScale / 100;
		this.cardWidth = cardScale * this.DEFAULT_CARD_WIDTH;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private updateInfo() {
		if (!this._heroPortraits) {
			return;
		}

		this.total = this._heroPortraits.length;
		this.unlocked = this._heroPortraits.filter((item) => item.numberOwned > 0).length;

		const groupedByClass = groupByFunction((portrait: CollectionReferenceCard) =>
			portrait.playerClass?.toLowerCase(),
		)(this._heroPortraits.filter(this.filterCardsOwned()));

		this.shownHeroPortraits = Object.keys(groupedByClass)
			.sort()
			.map((playerClass) => ({
				title: formatClass(playerClass),
				portraits: groupedByClass[playerClass],
			}));
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

interface PortraitGroup {
	readonly title: string;
	readonly portraits: readonly CollectionReferenceCard[];
}
