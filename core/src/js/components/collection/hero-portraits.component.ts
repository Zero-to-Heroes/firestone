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
import { ReferenceCard } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@services/cards-facade.service';
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
				<preference-toggle
					class="show-uncollectible-portraits"
					[ngClass]="{ 'active': showUncollectiblePortraits }"
					field="collectionShowUncollectiblePortraits"
					label="Show non-collectible"
					helpTooltip="Show non-collectible heroes, such as adventure bosses"
				></preference-toggle>
				<progress-bar class="progress-bar" *ngIf="total" [current]="unlocked" [total]="total"></progress-bar>
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

	@Input() set prefs(value: Preferences) {
		if (!value) {
			return;
		}

		this.showUncollectiblePortraits = value.collectionShowUncollectiblePortraits;
		this.handleDisplayPreferences(value);
		this.updateInfo();
	}

	showUncollectiblePortraits: boolean;
	_heroPortraits: readonly CollectionReferenceCard[];
	shownHeroPortraits: readonly PortraitGroup[];
	_navigation: NavigationCollection;
	unlocked: number;
	total: number;

	private allPortraits: readonly ReferenceCard[];
	private stateUpdater: EventEmitter<MainWindowStoreEvent>;
	private preferencesSubscription: Subscription;

	constructor(
		private readonly ow: OverwolfService,
		private readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
	) {}

	async ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
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

	private async handleDisplayPreferences(preferences: Preferences) {
		preferences = preferences;
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

		if (!this.showUncollectiblePortraits) {
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
		} else {
			this.total = undefined;
			this.unlocked = undefined;
			this.allPortraits =
				this.allPortraits ??
				this.allCards
					.getCards()
					.filter((card) => card.type === 'Hero')
					.filter((card) => card.audio && Object.keys(card.audio).length > 0)
					.filter((card) => !card.collectible);

			const groupedByClass = groupByFunction((portrait: ReferenceCard) => portrait.playerClass?.toLowerCase())(
				this.allPortraits,
			);

			this.shownHeroPortraits = Object.keys(groupedByClass)
				.sort()
				.map((playerClass) => ({
					title: formatClass(playerClass),
					portraits: groupedByClass[playerClass],
				}));
		}
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

interface PortraitGroup {
	readonly title: string;
	readonly portraits: readonly (ReferenceCard | CollectionReferenceCard)[];
}
