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
import { combineLatest, Observable } from 'rxjs';
import { Card } from '../../models/card';
import { CardBack } from '../../models/card-back';
import { CollectionPortraitCategoryFilter, CollectionPortraitOwnedFilter } from '../../models/collection/filter-types';
import { MemoryMercenary } from '../../models/memory/memory-mercenaries-info';
import { normalizeHeroCardId } from '../../services/battlegrounds/bgs-utils';
import { formatClass } from '../../services/hs-utils';
import { LocalizationFacadeService } from '../../services/localization-facade.service';
import { ShowCardDetailsEvent } from '../../services/mainwindow/store/events/collection/show-card-details-event';
import { MercenariesReferenceData } from '../../services/mercenaries/mercenaries-state-builder.service';
import { normalizeMercenariesCardId } from '../../services/mercenaries/mercenaries-utils';
import { OverwolfService } from '../../services/overwolf.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { groupByFunction, sortByProperties } from '../../services/utils';
import { AbstractSubscriptionStoreComponent } from '../abstract-subscription-store.component';
import { CollectionReferenceCard } from './collection-reference-card';

@Component({
	selector: 'hero-portraits',
	styleUrls: [`../../../css/component/collection/hero-portraits.component.scss`],
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
					<virtual-scroller
						#scroll
						class="portraits-for-class"
						[items]="value.shownHeroPortraits"
						[scrollDebounceTime]="scrollDebounceTime"
						scrollable
						(scrolling)="onScrolling($event)"
					>
						<ng-container *ngFor="let portraitGroup of scroll.viewPortItems">
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
						</ng-container>
					</virtual-scroller>
				</ul>
				<collection-empty-state *ngIf="!value.shownHeroPortraits?.length"> </collection-empty-state>
			</ng-container>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroPortraitsComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit, OnDestroy {
	readonly DEFAULT_CARD_WIDTH = 206;

	total$: Observable<number>;
	unlocked$: Observable<number>;
	shownHeroPortraits$: Observable<PortraitGroup[]>;

	cardWidth = this.DEFAULT_CARD_WIDTH;
	scrollDebounceTime = 0;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly allCards: CardsFacadeService,
		private readonly ow: OverwolfService,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		const mercenariesReferenceData$ = this.store
			.listen$(([main, nav, prefs]) => main.mercenaries.getReferenceData())
			.pipe(this.mapData(([mercs]) => mercs?.mercenaries));
		const relevantHeroes$ = combineLatest(
			this.store.listen$(
				([main, nav, prefs]) => main.binder.collection,
				([main, nav, prefs]) => main.binder.ownedBgsHeroSkins,
				([main, nav, prefs]) => main.mercenaries.collectionInfo?.Mercenaries,
			),
			mercenariesReferenceData$,
			this.listenForBasicPref$((prefs) => prefs.collectionActivePortraitCategoryFilter),
		).pipe(
			this.mapData(
				([[collection, ownedBgsHeroSkins, mercenariesCollection], mercenariesReferenceData, category]) => {
					switch (category) {
						case 'collectible':
							return this.buildCollectibleHeroPortraits(collection, this.allCards.getCards());
						case 'battlegrounds':
							return this.buildBattlegroundsHeroPortraits(ownedBgsHeroSkins, this.allCards.getCards());
						case 'mercenaries':
							return this.buildMercenariesHeroPortraits(
								mercenariesCollection,
								mercenariesReferenceData,
								this.allCards.getCards(),
							);
						case 'book-of-mercs':
							return this.buildBookOfMercenariesHeroPortraits(this.allCards.getCards());
					}
				},
			),
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

	onScrolling(scrolling: boolean) {
		this.scrollDebounceTime = scrolling ? 1000 : 0;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	trackByCardId(index: number, card: CardBack) {
		return card.id;
	}

	private groupPortraits(
		portraitCards: CollectionReferenceCard[],
		category: CollectionPortraitCategoryFilter,
	): PortraitGroup[] {
		const groupingFunction = this.buildGroupingFunction(category);
		const sortingFunction = this.buildSortingFunction(category);
		const groupedByClass = groupByFunction(groupingFunction)(portraitCards);
		const result = Object.keys(groupedByClass)
			.map((groupingKey) => ({
				title: this.buildGroupTitle(category, groupedByClass[groupingKey][0]),
				portraits: groupedByClass[groupingKey],
			}))
			.sort(sortingFunction);
		return result;
	}

	private buildGroupingFunction(category: CollectionPortraitCategoryFilter): (portrait: ReferenceCard) => string {
		switch (category) {
			case 'collectible':
				return (portrait: ReferenceCard) => portrait.playerClass?.toLowerCase();
			case 'battlegrounds':
				return (portrait: ReferenceCard) => normalizeHeroCardId(portrait.id, this.allCards);
			case 'mercenaries':
				return (portrait: ReferenceCard) => normalizeMercenariesCardId(portrait.id);
			case 'book-of-mercs':
				return (portrait: ReferenceCard) => {
					const match = /BOM_(\d+)_.*/g.exec(portrait.id);
					return match ? match[1] : '';
				};
		}
	}

	private buildSortingFunction(
		category: CollectionPortraitCategoryFilter,
	): (a: PortraitGroup, b: PortraitGroup) => number {
		switch (category) {
			default:
				return (a, b) => (a.title < b.title ? -1 : 1);
		}
	}

	private buildGroupTitle(category: CollectionPortraitCategoryFilter, refPortrait: ReferenceCard): string {
		switch (category) {
			case 'collectible':
				return formatClass(refPortrait.playerClass, this.i18n);
			case 'battlegrounds':
			case 'mercenaries':
				return refPortrait.name;
			case 'book-of-mercs':
				const match = /BOM_(\d+)_.*/g.exec(refPortrait.id);
				const storyIndex = match ? match[1] : '';
				switch (+storyIndex) {
					case 1:
						return `${storyIndex.padStart(2, '0')} - ${this.i18n.translateString(
							'app.collection.filters.hero-portrait.book-of-mercs-chapters.rokara',
						)}`;
					case 2:
						return `${storyIndex.padStart(2, '0')} - ${this.i18n.translateString(
							'app.collection.filters.hero-portrait.book-of-mercs-chapters.xyrella',
						)}`;
					case 3:
						return `${storyIndex.padStart(2, '0')} - ${this.i18n.translateString(
							'app.collection.filters.hero-portrait.book-of-mercs-chapters.guff',
						)}`;
					case 4:
						return `${storyIndex.padStart(2, '0')} - ${this.i18n.translateString(
							'app.collection.filters.hero-portrait.book-of-mercs-chapters.kurtrus',
						)}`;
					case 5:
						return `${storyIndex.padStart(2, '0')} - ${this.i18n.translateString(
							'app.collection.filters.hero-portrait.book-of-mercs-chapters.tamsin',
						)}`;
					case 6:
						return `${storyIndex.padStart(2, '0')} - ${this.i18n.translateString(
							'app.collection.filters.hero-portrait.book-of-mercs-chapters.cariel',
						)}`;
					case 7:
						return `${storyIndex.padStart(2, '0')} - ${this.i18n.translateString(
							'app.collection.filters.hero-portrait.book-of-mercs-chapters.scabbs',
						)}`;
					case 8:
						return `${storyIndex.padStart(2, '0')} - ${this.i18n.translateString(
							'app.collection.filters.hero-portrait.book-of-mercs-chapters.tavish',
						)}`;
					case 9:
						return `${storyIndex.padStart(2, '0')} - ${this.i18n.translateString(
							'app.collection.filters.hero-portrait.book-of-mercs-chapters.brukan',
						)}`;
					case 10:
						return `${storyIndex.padStart(2, '0')} - ${this.i18n.translateString(
							'app.collection.filters.hero-portrait.book-of-mercs-chapters.dawngrasp',
						)}`;
					default:
						return `${storyIndex.padStart(2, '0')} - ${this.i18n.translateString(
							'app.collection.filters.hero-portrait.book-of-mercs-chapters.other',
						)}`;
				}
		}
	}

	private buildBattlegroundsHeroPortraits(
		ownedBgsHeroSkins: readonly number[],
		cards: readonly ReferenceCard[],
	): readonly CollectionReferenceCard[] {
		const relevantPortraits: readonly ReferenceCard[] = cards
			.filter((card) => card.set === 'Battlegrounds')
			.filter((card) => card.battlegroundsHero || card.battlegroundsHeroSkin);
		const heroPortraits = relevantPortraits.map((card) =>
			(ownedBgsHeroSkins ?? []).includes(card.dbfId) || !card.battlegroundsHeroSkin
				? ({
						...card,
						numberOwned: 1,
				  } as CollectionReferenceCard)
				: ({
						...card,
						numberOwned: 0,
				  } as CollectionReferenceCard),
		) as CollectionReferenceCard[];
		const sortedHeroes = heroPortraits.sort(sortByProperties((card) => [card.id]));
		return sortedHeroes;
	}

	private buildMercenariesHeroPortraits(
		mercenariesCollection: readonly MemoryMercenary[],
		mercenariesReferenceData: readonly MercenariesReferenceData['mercenaries'][0][],
		cards: readonly ReferenceCard[],
	): readonly CollectionReferenceCard[] {
		if (!mercenariesCollection || !mercenariesReferenceData?.length) {
			return [];
		}
		const allArtVariations =
			mercenariesReferenceData
				// Get rid of the enemies
				?.filter((data) => data.skins?.length > 1)
				.map((data) => data.skins)
				.reduce((a, b) => a.concat(b), [])
				.map((skin) => skin.cardId) ?? [];
		const allMercenariesPortraits: readonly ReferenceCard[] = cards
			.filter((card) => card.set === 'Lettuce')
			.filter((card) => card.mercenary)
			.filter((card) => allArtVariations.includes(card.dbfId));
		const ownedMercenariesSkins =
			mercenariesCollection
				?.map((merc) => merc.Skins)
				.reduce((a, b) => a.concat(b), [])
				.map((skin) => skin.CardDbfId) ?? [];
		const heroPortraits = allMercenariesPortraits
			.filter((card) => allArtVariations.includes(card.dbfId))
			.map((card) =>
				ownedMercenariesSkins.includes(card.dbfId)
					? ({
							...card,
							numberOwned: 1,
					  } as CollectionReferenceCard)
					: ({
							...card,
							numberOwned: 0,
					  } as CollectionReferenceCard),
			) as CollectionReferenceCard[];
		const sortedHeroes = heroPortraits.sort(sortByProperties((card) => [card.id]));
		return sortedHeroes;
	}

	private buildCollectibleHeroPortraits(
		collection: readonly Card[],
		cards: readonly ReferenceCard[],
	): readonly CollectionReferenceCard[] {
		const relevantPortraits: readonly ReferenceCard[] = cards
			.filter((card) => card.set === 'Hero_skins')
			.filter((card) => card.collectible);
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
		const sortedHeroes = heroPortraits.sort(sortByProperties((card) => [card.playerClass, card.id]));
		return sortedHeroes;
	}

	private buildBookOfMercenariesHeroPortraits(cards: readonly ReferenceCard[]): readonly CollectionReferenceCard[] {
		const relevantPortraits: readonly ReferenceCard[] = cards
			.filter((card) => card.id.startsWith('BOM_'))
			.filter((card) => card.type === 'Hero');
		const heroPortraits = relevantPortraits.map(
			(card) =>
				({
					...card,
					numberOwned: 1,
				} as CollectionReferenceCard),
		) as CollectionReferenceCard[];
		const sortedHeroes = heroPortraits.sort(sortByProperties((card) => [card.id]));
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
