import { animate, state, style, transition, trigger } from '@angular/animations';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BinderState } from '../../models/mainwindow/binder-state';
import { Set } from '../../models/set';
import { AllCardsService } from '../../services/all-cards.service';

const COLLECTION_HIDE_TRANSITION_DURATION_IN_MS = 150;

@Component({
	selector: 'collection',
	styleUrls: [`../../../css/component/collection/collection.component.scss`],
	template: `
		<div class="collection">
			<section class="main" [ngClass]="{ 'divider': _state.currentView === 'cards' }">
				<collection-menu
					[displayType]="_state.menuDisplayType"
					[selectedSet]="_state.selectedSet"
					[selectedFormat]="_state.selectedFormat"
					[selectedCardId]="_state.selectedCard ? _state.selectedCard.id : ''"
					[searchString]="_state.searchString"
				>
				</collection-menu>
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
			</section>
			<section class="secondary">
				<card-search [searchString]="_state.searchString" [searchResults]="_state.searchResults"></card-search>
				<card-history
					[selectedCard]="_state.selectedCard"
					[cardHistory]="_state.cardHistory"
					[shownHistory]="_state.shownCardHistory"
					[showOnlyNewCards]="_state.showOnlyNewCardsInHistory"
					[totalHistoryLength]="_state.totalHistoryLength"
				>
				</card-history>
			</section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	animations: [
		trigger('viewState', [
			state(
				'hidden',
				style({
					opacity: 0,
					'pointer-events': 'none',
				}),
			),
			state(
				'shown',
				style({
					opacity: 1,
				}),
			),
			transition('hidden <=> shown', animate(`${COLLECTION_HIDE_TRANSITION_DURATION_IN_MS}ms linear`)),
		]),
	],
})
export class CollectionComponent {
	_state: BinderState;

	standardSets: Set[];
	wildSets: Set[];

	_viewState = 'shown';
	private refreshing = false;

	constructor(private cards: AllCardsService) {
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
		console.log('set state in collection');
	}
}
