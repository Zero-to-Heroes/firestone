import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ReferenceCard } from '@firestone-hs/reference-data/lib/models/reference-cards/reference-card';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { CardBack } from '../../models/card-back';
import { BinderState } from '../../models/mainwindow/binder-state';
import { NavigationState } from '../../models/mainwindow/navigation/navigation-state';
import { Preferences } from '../../models/preferences';
import { Set, SetCard } from '../../models/set';
import { SetsService } from '../../services/collection/sets-service.service';
import { CollectionReferenceCard } from './collection-reference-card';

@Component({
	selector: 'collection',
	styleUrls: [
		`../../../css/component/app-section.component.scss`,
		`../../../css/component/collection/collection.component.scss`,
	],
	template: `
		<div class="app-section collection">
			<section class="main" [ngClass]="{ 'divider': _navigation.navigationCollection.currentView === 'cards' }">
				<with-loading [isLoading]="dataState.isLoading">
					<div class="content main-content">
						<global-header
							[navigation]="_navigation"
							*ngIf="
								_navigation.text && _navigation?.navigationCollection.menuDisplayType === 'breadcrumbs'
							"
						>
						</global-header>
						<collection-menu-selection
							class="menu-selection"
							*ngxCacheIf="_navigation?.navigationCollection.menuDisplayType === 'menu'"
							[selectedTab]="_navigation.navigationCollection.currentView"
						>
						</collection-menu-selection>
						<sets
							[standardSets]="standardSets"
							[wildSets]="wildSets"
							[selectedFormat]="_navigation.navigationCollection.selectedFormat"
							*ngxCacheIf="_navigation.navigationCollection.currentView === 'sets'"
						>
						</sets>
						<cards
							[cardList]="_navigation.navigationCollection.cardList"
							[set]="selectedSet"
							[searchString]="_navigation.navigationCollection.searchString"
							*ngxCacheIf="_navigation.navigationCollection.currentView === 'cards'"
						>
						</cards>
						<full-card
							class="full-card"
							[selectedCard]="selectedCard"
							*ngxCacheIf="_navigation.navigationCollection.currentView === 'card-details'"
						>
						</full-card>
						<card-backs
							*ngxCacheIf="_navigation.navigationCollection.currentView === 'card-backs'"
							[cardBacks]="dataState?.cardBacks"
						>
						</card-backs>
						<full-card-back
							class="full-card"
							[cardBack]="selectedCardBack"
							[prefs]="prefs"
							*ngxCacheIf="_navigation.navigationCollection.currentView === 'card-back-details'"
						>
						</full-card-back>
						<hero-portraits
							*ngxCacheIf="_navigation.navigationCollection.currentView === 'hero-portraits'"
							[heroPortraits]="heroPortraits"
						>
						</hero-portraits>
						<the-coins
							*ngxCacheIf="_navigation.navigationCollection.currentView === 'coins'"
							[coins]="coins"
						>
						</the-coins>
						<pack-stats
							*ngxCacheIf="_navigation.navigationCollection.currentView === 'packs'"
							[state]="dataState"
						>
						</pack-stats>
					</div>
				</with-loading>
			</section>
			<section class="secondary">
				<card-search
					[searchString]="_navigation.navigationCollection.searchString"
					[searchResults]="searchResults"
					*ngxCacheIf="_navigation.navigationCollection.currentView !== 'packs' && !isSetDetails()"
				></card-search>
				<card-history
					[selectedCard]="selectedCard"
					[prefs]="prefs"
					[state]="dataState"
					*ngxCacheIf="_navigation.navigationCollection.currentView !== 'packs' && !isSetDetails()"
				>
				</card-history>
				<pack-history
					[state]="dataState"
					*ngxCacheIf="_navigation.navigationCollection.currentView === 'packs'"
				>
				</pack-history>
				<set-stats [set]="selectedSet" [state]="dataState" [prefs]="prefs" *ngxCacheIf="isSetDetails()">
				</set-stats>
			</section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionComponent {
	dataState: BinderState;
	_navigation: NavigationState;

	standardSets: Set[];
	wildSets: Set[];

	selectedSet: Set;
	selectedCard: SetCard | ReferenceCard;
	selectedCardBack: CardBack;
	searchResults: readonly SetCard[];
	heroPortraits: readonly CollectionReferenceCard[] = [];
	coins: readonly CollectionReferenceCard[] = [];

	@Input() set state(state: BinderState) {
		this.dataState = state;
		this.standardSets = state.allSets.filter(set => set.standard);
		this.wildSets = state.allSets.filter(set => !set.standard);
		// console.log('set state in collection', this._state);
		this.updateValues();
	}

	@Input() set navigation(value: NavigationState) {
		this._navigation = value;
		this.updateValues();
	}

	@Input() prefs: Preferences;

	isSetDetails(): boolean {
		return (
			this._navigation.navigationCollection.currentView === 'cards' &&
			this.selectedSet &&
			!this._navigation.navigationCollection.searchString
		);
	}

	constructor(private cards: SetsService, private readonly allCards: AllCardsService) {
		this.init();
	}

	private updateValues() {
		if (!this.dataState || !this._navigation) {
			return;
		}

		this.selectedSet = this.dataState.allSets.find(
			set => set.id === this._navigation.navigationCollection?.selectedSetId,
		);
		this.selectedCard = this._navigation.navigationCollection?.selectedCardId
			? this.dataState.allSets
					.map(set => set.allCards)
					.reduce((a, b) => a.concat(b), [])
					.find(card => card.id === this._navigation.navigationCollection?.selectedCardId) ??
			  // This is the case when it's not a collectible card for instance
			  this.allCards.getCard(this._navigation.navigationCollection?.selectedCardId)
			: null;
		this.selectedCardBack = this.dataState.cardBacks.find(
			cardBack => cardBack.id === this._navigation.navigationCollection?.selectedCardBackId,
		);
		this.searchResults =
			this._navigation.navigationCollection.searchResults?.length > 0
				? this.dataState.allSets
						.map(set => set.allCards)
						.reduce((a, b) => a.concat(b), [])
						.filter(card => this._navigation.navigationCollection.searchResults.indexOf(card.id) !== -1)
				: null;
		this.heroPortraits = this.buildHeroPortraits();
		this.coins = this.buildCoins();
	}

	private buildHeroPortraits(): readonly CollectionReferenceCard[] {
		const allPortraits: readonly ReferenceCard[] = this.allCards
			.getCards()
			.filter(card => card.set === 'Hero_skins')
			.filter(card => card.collectible);
		const portraitCardIds = allPortraits.map(card => card.id);
		const ownedPortraits = this.dataState.collection
			.filter(card => (card.count ?? 0) + (card.premiumCount ?? 0) > 0)
			.map(card => card.id)
			.filter(cardId => portraitCardIds.includes(cardId));
		return allPortraits.map(card =>
			ownedPortraits.includes(card.id)
				? ({
						...card,
						numberOwned: 1,
				  } as CollectionReferenceCard)
				: card,
		) as CollectionReferenceCard[];
	}

	private buildCoins(): readonly CollectionReferenceCard[] {
		return this.dataState.coins
			.map(coin => {
				const refCoin = this.allCards.getCard(coin.cardId);
				return {
					...refCoin,
					numberOwned: coin.owned ? 1 : 0,
				};
			})
			.sort((a, b) => a.dbfId - b.dbfId);
	}

	private async init() {
		// First initialize the cards DB, as some of the dependencies injected in
		// app-bootstrap won't be able to start without the cards DB in place
		await this.cards.initializeCardsDb();
	}
}
