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
			<section class="main" [ngClass]="{ 'divider': navigation.navigationCollection.currentView === 'cards' }">
				<with-loading [isLoading]="dataState.isLoading">
					<global-header [navigation]="navigation" *ngIf="navigation.text"> </global-header>
					<sets
						[selectedFormat]="navigation.navigationCollection.selectedFormat"
						[standardSets]="standardSets"
						[wildSets]="wildSets"
						[hidden]="navigation.navigationCollection.currentView !== 'sets'"
					>
					</sets>
					<cards
						[cardList]="navigation.navigationCollection.cardList"
						[set]="getSelectedSet()"
						[searchString]="navigation.navigationCollection.searchString"
						[hidden]="navigation.navigationCollection.currentView !== 'cards'"
					>
					</cards>
					<full-card
						class="full-card"
						[selectedCard]="getSelectedCard()"
						[hidden]="navigation.navigationCollection.currentView !== 'card-details'"
					>
					</full-card>
				</with-loading>
			</section>
			<section class="secondary">
				<card-search
					[searchString]="navigation.navigationCollection.searchString"
					[searchResults]="navigation.navigationCollection.searchResults"
				></card-search>
				<card-history
					[selectedCard]="getSelectedCard()"
					[cardHistory]="dataState.cardHistory"
					[shownHistory]="navigation.navigationCollection.shownCardHistory"
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
	@Input() navigation: NavigationState;

	standardSets: Set[];
	wildSets: Set[];

	@Input('state') set state(state: BinderState) {
		this.dataState = state;
		this.standardSets = state.allSets.filter(set => set.standard);
		this.wildSets = state.allSets.filter(set => !set.standard);
		// console.log('set state in collection', this._state);
	}

	constructor(private cards: SetsService, private cdr: ChangeDetectorRef) {
		this.init();
	}

	getSelectedSet(): Set {
		if (!this.dataState || !this.navigation?.navigationCollection?.selectedSetId) {
			return null;
		}
		return this.dataState.allSets.find(set => set.id === this.navigation.navigationCollection.selectedSetId);
	}

	getSelectedCard(): SetCard {
		if (!this.dataState || !this.navigation?.navigationCollection?.selectedCardId) {
			return null;
		}
		return this.dataState.allSets
			.map(set => set.allCards)
			.reduce((a, b) => a.concat(b), [])
			.find(card => card.id === this.navigation.navigationCollection.selectedCardId);
	}

	private async init() {
		// First initialize the cards DB, as some of the dependencies injected in
		// app-bootstrap won't be able to start without the cards DB in place
		await this.cards.initializeCardsDb();
	}
}
