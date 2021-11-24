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
import { combineLatest, Observable } from 'rxjs';
import { Card } from '../../models/card';
import { CardBack } from '../../models/card-back';
import { CollectionPortraitCategoryFilter, CollectionPortraitOwnedFilter } from '../../models/collection/filter-types';
import { normalizeHeroCardId } from '../../services/battlegrounds/bgs-utils';
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
				<collection-hero-portrait-owned-filter
					class="filter hero-portrait-owned-filter"
				></collection-hero-portrait-owned-filter>
				<collection-hero-portrait-categories-filter
					class="filter hero-portrait-categories-filter"
				></collection-hero-portrait-categories-filter>
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
	readonly DEFAULT_CARD_WIDTH = 206;

	total$: Observable<number>;
	unlocked$: Observable<number>;
	shownHeroPortraits$: Observable<readonly PortraitGroup[]>;

	cardWidth = this.DEFAULT_CARD_WIDTH;

	constructor(
		private readonly ow: OverwolfService,
		private readonly allCards: CardsFacadeService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		const allBgPortraits: readonly ReferenceCard[] = this.allCards
			.getCards()
			.filter((card) => card.set === 'Battlegrounds')
			.filter((card) => card.battlegroundsHero || card.battlegroundsHeroSkin);
		const allCollectiblePortraits: readonly ReferenceCard[] = this.allCards
			.getCards()
			.filter((card) => card.set === 'Hero_skins')
			.filter((card) => card.collectible);
		const relevantHeroes$ = combineLatest(
			this.store.listen$(
				([main, nav, prefs]) => main.binder.collection,
				([main, nav, prefs]) => main.binder.ownedBgsHeroSkins,
			),
			this.listenForBasicPref$((prefs) => prefs.collectionActivePortraitCategoryFilter),
		).pipe(
			this.mapData(([[collection, ownedBgsHeroSkins], category]) => {
				console.debug('collection', collection);
				switch (category) {
					case 'collectible':
						return this.buildCollectibleHeroPortraits(collection, allCollectiblePortraits);
					case 'battlegrounds':
						return this.buildBattlegroundsHeroPortraits(ownedBgsHeroSkins, allBgPortraits);
				}
			}),
		);
		this.total$ = relevantHeroes$.pipe(this.mapData((heroes) => heroes.length));
		this.unlocked$ = relevantHeroes$.pipe(
			this.mapData((heroes) => heroes.filter((item) => item.numberOwned > 0).length),
		);

		const filteredHeroPortraits$ = combineLatest(
			relevantHeroes$,
			this.listenForBasicPref$((prefs) => prefs.collectionActivePortraitCategoryFilter),
			this.listenForBasicPref$((prefs) => prefs.collectionActivePortraitOwnedFilter),
		).pipe(this.mapData(([heroes, category, owned]) => heroes.filter(this.filterCardsOwned(owned))));
		this.shownHeroPortraits$ = combineLatest(
			filteredHeroPortraits$,
			this.listenForBasicPref$((prefs) => prefs.collectionActivePortraitCategoryFilter),
			this.listenForBasicPref$((prefs) => prefs.collectionActivePortraitOwnedFilter),
		).pipe(
			this.mapData(([portraitCards, category, cardsOwnedActiveFilter]) =>
				this.groupPortraits(portraitCards, category),
			),
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

	showFullHeroPortrait(heroPortrait: CollectionReferenceCard) {
		this.store.send(new ShowCardDetailsEvent(heroPortrait.id));
	}

	trackByCardId(index: number, card: CardBack) {
		return card.id;
	}

	private groupPortraits(
		portraitCards: CollectionReferenceCard[],
		category: CollectionPortraitCategoryFilter,
	): readonly PortraitGroup[] {
		const groupingFunction = this.buildGroupingFunction(category);
		const sortingFunction = this.buildSortingFunction(category);
		const groupedByClass = groupByFunction(groupingFunction)(portraitCards);
		return Object.keys(groupedByClass)
			.map((groupingKey) => ({
				title: this.buildGroupTitle(category, groupedByClass[groupingKey][0]),
				portraits: groupedByClass[groupingKey],
			}))
			.sort(sortingFunction);
	}

	private buildGroupingFunction(category: CollectionPortraitCategoryFilter): (portrait: ReferenceCard) => string {
		switch (category) {
			case 'collectible':
				return (portrait: ReferenceCard) => portrait.playerClass?.toLowerCase();
			case 'battlegrounds':
				return (portrait: ReferenceCard) => normalizeHeroCardId(portrait.id);
		}
	}

	private buildSortingFunction(
		category: CollectionPortraitCategoryFilter,
	): (a: PortraitGroup, b: PortraitGroup) => number {
		switch (category) {
			case 'collectible':
			case 'battlegrounds':
				return (a, b) => (a.title < b.title ? -1 : 1);
		}
	}

	private buildGroupTitle(category: CollectionPortraitCategoryFilter, refPortrait: ReferenceCard): string {
		switch (category) {
			case 'collectible':
				return formatClass(refPortrait.playerClass);
			case 'battlegrounds':
				return refPortrait.name;
		}
	}

	private buildBattlegroundsHeroPortraits(
		ownedBgsHeroSkins: readonly number[],
		relevantPortraits: readonly ReferenceCard[],
	): readonly CollectionReferenceCard[] {
		const heroPortraits = relevantPortraits.map((card) =>
			ownedBgsHeroSkins.includes(card.dbfId) || !card.battlegroundsHeroSkin
				? ({
						...card,
						numberOwned: 1,
				  } as CollectionReferenceCard)
				: ({
						...card,
						numberOwned: 0,
				  } as CollectionReferenceCard),
		) as CollectionReferenceCard[];
		const sortedHeroes = sortBy(heroPortraits, 'id');
		return sortedHeroes;
	}

	private buildCollectibleHeroPortraits(
		collection: readonly Card[],
		relevantPortraits: readonly ReferenceCard[],
	): readonly CollectionReferenceCard[] {
		const portraitCardIds = relevantPortraits.map((card) => card.id);
		const ownedPortraits = collection
			.filter((card) => (card.count ?? 0) + (card.premiumCount ?? 0) > 0)
			.map((card) => card.id)
			.filter((cardId) => portraitCardIds.includes(cardId));
		const heroPortraits = relevantPortraits.map((card) =>
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
		const sortedHeroes = sortBy(heroPortraits, 'id', 'playerClass');
		return sortedHeroes;
	}

	private filterCardsOwned(cardsOwnedActiveFilter: CollectionPortraitOwnedFilter) {
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
