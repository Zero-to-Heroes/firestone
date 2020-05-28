import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { BinderState } from '../../models/mainwindow/binder-state';
import { NavigationState } from '../../models/mainwindow/navigation/navigation-state';
import { Set, SetCard } from '../../models/set';
import { SetsService } from '../../services/sets-service.service';

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
					<div class="content">
						<global-header [navigation]="_navigation" *ngIf="_navigation.text"> </global-header>
						<sets
							[selectedFormat]="_navigation.navigationCollection.selectedFormat"
							[standardSets]="standardSets"
							[wildSets]="wildSets"
							[hidden]="_navigation.navigationCollection.currentView !== 'sets'"
						>
						</sets>
						<cards
							[cardList]="_navigation.navigationCollection.cardList"
							[set]="selectedSet"
							[searchString]="_navigation.navigationCollection.searchString"
							[hidden]="_navigation.navigationCollection.currentView !== 'cards'"
						>
						</cards>
						<full-card
							class="full-card"
							[selectedCard]="selectedCard"
							[hidden]="_navigation.navigationCollection.currentView !== 'card-details'"
						>
						</full-card>
					</div>
				</with-loading>
			</section>
			<section class="secondary">
				<card-search
					[searchString]="_navigation.navigationCollection.searchString"
					[searchResults]="searchResults"
				></card-search>
				<card-history
					[selectedCard]="selectedCard"
					[cardHistory]="dataState.cardHistory"
					[shownHistory]="_navigation.navigationCollection.shownCardHistory"
					[totalHistoryLength]="dataState.totalHistoryLength"
				>
				</card-history>
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
	selectedCard: SetCard;
	searchResults: readonly SetCard[];

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

	constructor(private cards: SetsService, private cdr: ChangeDetectorRef) {
		this.init();
	}

	private updateValues() {
		if (!this.dataState || !this._navigation) {
			return;
		}
		this.selectedSet = this.dataState.allSets.find(
			set => set.id === this._navigation.navigationCollection?.selectedSetId,
		);
		this.selectedCard = this.dataState.allSets
			.map(set => set.allCards)
			.reduce((a, b) => a.concat(b), [])
			.find(card => card.id === this._navigation.navigationCollection?.selectedCardId);
		this.searchResults =
			this._navigation.navigationCollection.searchResults?.length > 0
				? this.dataState.allSets
						.map(set => set.allCards)
						.reduce((a, b) => a.concat(b), [])
						.filter(card => this._navigation.navigationCollection.searchResults.indexOf(card.id) !== -1)
				: null;
	}

	private async init() {
		// First initialize the cards DB, as some of the dependencies injected in
		// app-bootstrap won't be able to start without the cards DB in place
		await this.cards.initializeCardsDb();
	}
}
