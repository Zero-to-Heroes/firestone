import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { BinderState } from '../../models/mainwindow/binder-state';
import { Navigation } from '../../models/mainwindow/navigation';
import { Set } from '../../models/set';
import { SetsService } from '../../services/sets-service.service';

@Component({
	selector: 'collection',
	styleUrls: [
		`../../../css/component/app-section.component.scss`,
		`../../../css/component/collection/collection.component.scss`,
	],
	template: `
		<div class="app-section collection">
			<section class="main" [ngClass]="{ 'divider': _state.currentView === 'cards' }">
				<with-loading [isLoading]="_state.isLoading">
					<global-header [navigation]="navigation" *ngIf="navigation.text"> </global-header>
					<sets
						[selectedFormat]="_state.selectedFormat"
						[standardSets]="standardSets"
						[wildSets]="wildSets"
						[hidden]="_state.currentView !== 'sets'"
					>
					</sets>
					<cards
						[cardList]="_state.cardList"
						[set]="_state.selectedSet"
						[searchString]="_state.searchString"
						[hidden]="_state.currentView !== 'cards'"
					>
					</cards>
					<full-card
						class="full-card"
						[selectedCard]="_state.selectedCard"
						[hidden]="_state.currentView !== 'card-details'"
					>
					</full-card>
				</with-loading>
			</section>
			<section class="secondary">
				<card-search [searchString]="_state.searchString" [searchResults]="_state.searchResults"></card-search>
				<card-history
					[selectedCard]="_state.selectedCard"
					[cardHistory]="_state.cardHistory"
					[shownHistory]="_state.shownCardHistory"
					[totalHistoryLength]="_state.totalHistoryLength"
				>
				</card-history>
			</section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionComponent {
	_state: BinderState;
	@Input() navigation: Navigation;

	standardSets: Set[];
	wildSets: Set[];

	constructor(private cards: SetsService, private cdr: ChangeDetectorRef) {
		this.init();
	}

	private async init() {
		// First initialize the cards DB, as some of the dependencies injected in
		// app-bootstrap won't be able to start without the cards DB in place
		await this.cards.initializeCardsDb();
	}

	@Input('state') set state(state: BinderState) {
		this.standardSets = state.allSets.filter(set => set.standard);
		this.wildSets = state.allSets.filter(set => !set.standard);
		this._state = state;
		// console.log('set state in collection', this._state);
	}
}
