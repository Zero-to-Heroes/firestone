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
export class CollectionComponent implements AfterViewInit {

	_state: BinderState;

	standardSets: Set[];
	wildSets: Set[];
	
	_viewState: string = 'shown';
	private refreshing = false;

	@Input("state") set state(state: BinderState) {
		this.standardSets = state.allSets.filter((set) => set.standard);
		this.wildSets = state.allSets.filter((set) => !set.standard);
		// const shouldShowTransition = (state.selectedSet && this._state.selectedSet !== state.selectedSet)
		// 		|| ();
		// if (shouldShowTransition) {
		// 	this.transitionState(() => { });
		// }
		this._state = state;
		console.log('set state in collection', this._state);
	};

	ngAfterViewInit() {
		// this.updateSets();
	}

	// private transitionState(changeStateCallback: Function) {
	// 	this._viewState = "hidden";
	// 	if (!(<ViewRef>this.cdr).destroyed) {
	// 		this.cdr.detectChanges();
	// 	}
	// 	setTimeout(() => {
	// 		changeStateCallback();
	// 		this._viewState = "shown";
	// 		if (!(<ViewRef>this.cdr).destroyed) {
	// 			this.cdr.detectChanges();
	// 		}
	// 	}, COLLECTION_HIDE_TRANSITION_DURATION_IN_MS);
	// }

	// private async updateSets() {
	// 	if (this.refreshing) {
	// 		return;
	// 	}
	// 	this.refreshing = true;
	// 	const collection = await this.collectionManager.getCollection();
	// 	this.buildSetsFromCollection(collection);
	// 	this.refreshing = false;
	// 	console.log('sets updated', this.standardSets, this.wildSets);
	// 	if (!(<ViewRef>this.cdr).destroyed) {
	// 		this.cdr.detectChanges();
	// 	}
	// }

	// private buildSetsFromCollection(collection: Card[]) {
	// 	this.pityTimer.getPityTimers().then((pityTimers: PityTimer[]) => {
	// 		console.log('building sets from collection with pity timers', pityTimers);
	// 		const standardSets = this.cards.getStandardSets();
	// 		this.standardSets = standardSets
	// 				.map((set) => ({ set: set, pityTimer: pityTimers.filter(timer => timer.setId == set.id)[0]}))
	// 				.map((set) => this.mergeSet(collection, set.set, set.pityTimer));
	// 		const wildSets = this.cards.getWildSets();
	// 		this.wildSets = wildSets
	// 				.map((set) => ({ set: set, pityTimer: pityTimers.filter(timer => timer.setId == set.id)[0]}))
	// 				.map((set) => this.mergeSet(collection, set.set, set.pityTimer));
	// 		if (!(<ViewRef>this.cdr).destroyed) {
	// 			this.cdr.detectChanges();
	// 		}
	// 	});
	// }

	// private async buildSet(fullCardId: string): Promise<Set> {
	// 	const collection = await this.collectionManager.getCollection();
	// 	console.log('building set from', fullCardId);
	// 	const set = this.cards.getSetFromCardId(fullCardId);
	// 	console.log('base set is', set);
	// 	const pityTimer = await this.pityTimer.getPityTimer(set.id);
	// 	const mergedSet = this.mergeSet(collection, set, pityTimer);
	// 	return mergedSet;
	// }

	// private mergeSet(collection: Card[], set: Set, pityTimer: PityTimer): Set {
	// 	const updatedCards: SetCard[] = this.mergeFullCards(collection, set.allCards);
	// 	const ownedLimitCollectibleCards = updatedCards
	// 		.map((card: SetCard) => card.getNumberCollected())
	// 		.reduce((c1, c2) => c1 + c2, 0);
	// 	const ownedLimitCollectiblePremiumCards = updatedCards
	// 		.map((card: SetCard) => card.getNumberCollectedPremium())
	// 		.reduce((c1, c2) => c1 + c2, 0);
	// 	return new Set(
	// 		set.id,
	// 		set.name,
	// 		set.standard,
	// 		updatedCards,
	// 		pityTimer,
	// 		ownedLimitCollectibleCards,
	// 		ownedLimitCollectiblePremiumCards);
	// }

	// private mergeFullCards(collection: Card[], setCards: ReadonlyArray<SetCard>): SetCard[] {
	// 	return setCards.map((card: SetCard) => {
	// 		const collectionCard: Card = collection.find((collectionCard: Card) => collectionCard.id === card.id);
	// 		const ownedPremium = collectionCard ? collectionCard.premiumCount : 0;
	// 		const ownedNonPremium = collectionCard ? collectionCard.count : 0;
	// 		return new SetCard(card.id, card.name, card.cardClass, card.rarity, card.cost, ownedNonPremium, ownedPremium);
	// 	});
	// }
}
