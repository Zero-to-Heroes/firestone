import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { ReferenceCard } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@services/cards-facade.service';
import { sortBy } from 'lodash';
import { IOption } from 'ng-select';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { Card } from '../../models/card';
import { CardBack } from '../../models/card-back';
import { formatClass } from '../../services/hs-utils';
import { ShowCardDetailsEvent } from '../../services/mainwindow/store/events/collection/show-card-details-event';
import { OverwolfService } from '../../services/overwolf.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { groupByFunction } from '../../services/utils';
import { AbstractSubscriptionComponent } from '../abstract-subscription.component';
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
				<!-- <preference-toggle
					class="show-uncollectible-portraits"
					[ngClass]="{ 'active': showUncollectiblePortraits$ | async }"
					field="collectionShowUncollectiblePortraits"
					label="Show non-collectible"
					helpTooltip="Show non-collectible heroes, such as adventure bosses"
				></preference-toggle> -->
				<progress-bar
					class="progress-bar"
					*ngIf="total$ | async as total"
					[current]="unlocked$ | async"
					[total]="total"
				></progress-bar>
			</div>
			<ng-container *ngIf="{ shownHeroPortraits: shownHeroPortraits$ | async } as value">
				<ul class="cards-list" *ngIf="value.shownHeroPortraits?.length" scrollable>
					<div
						class="portraits-for-class"
						*ngFor="let portraitGroup of value.shownHeroPortraits; let i = index; trackBy: trackByTitle"
					>
						<div class="header">{{ portraitGroup.title }}</div>
						<div class="portraits-container">
							<hero-portrait
								class="hero-portrait"
								*ngFor="
									let heroPortrait of portraitGroup.portraits;
									let i = index;
									trackBy: trackByCardId
								"
								[heroPortrait]="heroPortrait"
								[style.width.px]="cardWidth"
								(click)="showFullHeroPortrait(heroPortrait)"
							>
							</hero-portrait>
						</div>
					</div>
				</ul>
				<collection-empty-state *ngIf="!value.shownHeroPortraits?.length"> </collection-empty-state>
			</ng-container>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroPortraitsComponent extends AbstractSubscriptionComponent implements AfterContentInit, OnDestroy {
	readonly DEFAULT_CARD_WIDTH = 174;

	// showUncollectiblePortraits$: Observable<boolean>;
	total$: Observable<number>;
	unlocked$: Observable<number>;
	shownHeroPortraits$: Observable<readonly PortraitGroup[]>;

	cardWidth = this.DEFAULT_CARD_WIDTH;
	cardsOwnedActiveFilter$$ = new BehaviorSubject<'own' | 'dontown' | 'all'>('all');

	// @Input() set heroPortraits(value: readonly CollectionReferenceCard[]) {
	// 	sortedHeroes = sortBy(value, 'id', 'playerClass');
	// 	this.updateInfo();
	// }

	// @Input() set navigation(value: NavigationCollection) {
	// 	this._navigation = value;
	// 	this.updateInfo();
	// }

	// _heroPortraits: readonly CollectionReferenceCard[];
	// _navigation: NavigationCollection;

	private allPortraits: readonly ReferenceCard[];

	constructor(
		private readonly ow: OverwolfService,
		private readonly allCards: CardsFacadeService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
		this.allPortraits = this.allCards
			.getCards()
			.filter((card) => card.type === 'Hero')
			.filter((card) => card.audio && Object.keys(card.audio).length > 0)
			.filter((card) => !card.collectible);
	}

	async ngAfterContentInit() {
		// this.showUncollectiblePortraits$ = this.listenForBasicPref$(
		// 	(prefs) => prefs.collectionShowUncollectiblePortraits,
		// );

		const sortedHeroes$ = this.store
			.listen$(([main, nav, prefs]) => main.binder.collection)
			.pipe(
				this.mapData(([collection]) => {
					const heroPortraits = this.buildHeroPortraits(collection);
					return sortBy(heroPortraits, 'id', 'playerClass');
				}),
			);
		this.shownHeroPortraits$ = combineLatest(
			// this.showUncollectiblePortraits$,
			sortedHeroes$,
			this.cardsOwnedActiveFilter$$.asObservable(),
		).pipe(
			this.mapData(([sortedHeroes, cardsOwnedActiveFilter]) => {
				// if (!showUncollectiblePortraits) {
				const groupedByClass = groupByFunction((portrait: CollectionReferenceCard) =>
					portrait.playerClass?.toLowerCase(),
				)(sortedHeroes.filter(this.filterCardsOwned(cardsOwnedActiveFilter)));
				return Object.keys(groupedByClass)
					.sort()
					.map((playerClass) => ({
						title: formatClass(playerClass),
						portraits: groupedByClass[playerClass],
					}));
				// } else {
				// 	const groupedByClass = groupByFunction((portrait: ReferenceCard) =>
				// 		portrait.playerClass?.toLowerCase(),
				// 	)(this.allPortraits);
				// 	return Object.keys(groupedByClass)
				// 		.sort()
				// 		.map((playerClass) => ({
				// 			title: formatClass(playerClass),
				// 			portraits: groupedByClass[playerClass],
				// 		}));
				// }
			}),
		);
		this.total$ = sortedHeroes$.pipe(this.mapData((heroes) => heroes.length));
		this.unlocked$ = sortedHeroes$.pipe(
			this.mapData((heroes) => heroes.filter((item) => item.numberOwned > 0).length),
		);

		this.store
			.listenPrefs$((prefs) => prefs.collectionCardScale)
			.pipe(this.mapData(([pref]) => pref))
			.subscribe((value) => {
				const cardScale = value / 100;
				this.cardWidth = cardScale * this.DEFAULT_CARD_WIDTH;
				if (!(this.cdr as ViewRef)?.destroyed) {
					this.cdr.detectChanges();
				}
			});
	}

	selectCardsOwnedFilter(option: IOption) {
		this.cardsOwnedActiveFilter$$.next(option.value as any);
	}

	showFullHeroPortrait(heroPortrait: CollectionReferenceCard) {
		this.store.send(new ShowCardDetailsEvent(heroPortrait.id));
	}

	trackByCardId(index: number, card: CardBack) {
		return card.id;
	}

	private buildHeroPortraits(collection: readonly Card[]): readonly CollectionReferenceCard[] {
		const allPortraits: readonly ReferenceCard[] = this.allCards
			.getCards()
			.filter((card) => card.set === 'Hero_skins')
			.filter((card) => card.collectible);
		const portraitCardIds = allPortraits.map((card) => card.id);
		const ownedPortraits = collection
			.filter((card) => (card.count ?? 0) + (card.premiumCount ?? 0) > 0)
			.map((card) => card.id)
			.filter((cardId) => portraitCardIds.includes(cardId));
		return allPortraits.map((card) =>
			ownedPortraits.includes(card.id)
				? ({
						...card,
						numberOwned: 1,
				  } as CollectionReferenceCard)
				: ({
						...card,
						numberOwned: 0,
				  } as CollectionReferenceCard),
		) as CollectionReferenceCard[];
	}

	private filterCardsOwned(cardsOwnedActiveFilter: 'own' | 'dontown' | 'all') {
		switch (cardsOwnedActiveFilter) {
			case 'own':
				return (card: CollectionReferenceCard) => card.numberOwned > 0;
			case 'dontown':
				return (card: CollectionReferenceCard) => !card.numberOwned;
			case 'all':
				return (card: CollectionReferenceCard) => true;
			default:
				console.warn('unknown filter', cardsOwnedActiveFilter);
				return (card: CollectionReferenceCard) => true;
		}
	}
}

interface PortraitGroup {
	readonly title: string;
	readonly portraits: readonly (ReferenceCard | CollectionReferenceCard)[];
}
