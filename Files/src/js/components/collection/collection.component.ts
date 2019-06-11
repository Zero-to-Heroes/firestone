import { Component, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Input } from '@angular/core';
import { trigger, state, transition, style, animate } from '@angular/animations';

import { Set } from '../../models/set';
import { BinderState } from '../../models/mainwindow/binder-state';

const COLLECTION_HIDE_TRANSITION_DURATION_IN_MS = 150;

@Component({
	selector: 'collection',
	styleUrls: [
		`../../../css/component/collection/collection.component.scss`,
	],
	template: `
		<div class="collection">
			<section class="main" [ngClass]="{'divider': _state.currentView == 'cards'}">
				<collection-menu
					[displayType]="_state.menuDisplayType"
					[selectedSet]="_state.selectedSet"
					[selectedFormat]="_state.selectedFormat"
					[selectedCardId]="_state.selectedCard ? _state.selectedCard.id : ''"
					[searchString]="_state.searchString">
				</collection-menu>
				<ng-container [ngSwitch]="_state.currentView">
					<sets *ngSwitchCase="'sets'" 
							[selectedFormat]="_state.selectedFormat"
							[standardSets]="standardSets"
							[wildSets]="wildSets">
					</sets>
					<cards *ngSwitchCase="'cards'" 
							[cardList]="_state.cardList" 
							[set]="_state.selectedSet" 
							[searchString]="_state.searchString">
					</cards>
					<full-card *ngSwitchCase="'card-details'" 
							class="full-card" 
							[selectedCard]="_state.selectedCard">
					</full-card>
				</ng-container>
			</section>
			<section class="secondary">
				<card-search [searchString]="_state.searchString" [searchResults]="_state.searchResults"></card-search>
				<card-history 
						[selectedCard]="_state.selectedCard" 
						[cardHistory]="_state.cardHistory"
						[shownHistory]="_state.shownCardHistory"
						[showOnlyNewCards]="_state.showOnlyNewCardsInHistory"
						[totalHistoryLength]="_state.totalHistoryLength">
				</card-history>
			</section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	animations: [
		trigger('viewState', [
			state('hidden',	style({
				opacity: 0,
				"pointer-events": "none",
			})),
			state('shown',	style({
				opacity: 1,
			})),
			transition(
				'hidden <=> shown',
				animate(`${COLLECTION_HIDE_TRANSITION_DURATION_IN_MS}ms linear`)),
		])
	]
})
export class CollectionComponent {

	_state: BinderState;

	standardSets: Set[];
	wildSets: Set[];
	
	_viewState: string = 'shown';
	private refreshing = false;

	@Input("state") set state(state: BinderState) {
		this.standardSets = state.allSets.filter((set) => set.standard);
		this.wildSets = state.allSets.filter((set) => !set.standard);
		this._state = state;
		console.log('set state in collection', this._state);
	};
}
