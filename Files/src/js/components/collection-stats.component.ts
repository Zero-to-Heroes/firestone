import { Component, NgZone, OnInit } from '@angular/core';

import * as Raven from 'raven-js';

import { CollectionManager } from '../services/collection-manager.service';
import { AllCardsService } from '../services/all-cards.service';

import { Card } from '../models/card';
import { Set, SetCard } from '../models/set';

declare var overwolf: any;

@Component({
	selector: 'collection-stats',
	styleUrls: [`../../css/component/collection-stats.component.scss`],
	template: `
		<div class="collection-stats">
			<div class="sets">
				<sets-container [sets]="standardSets" [category]="'Standard'" (onSetSelected)=onSetSelected($event)></sets-container>
				<sets-container [sets]="wildSets" [category]="'Wild'" (onSetSelected)=onSetSelected($event)></sets-container>
			</div>
			<card-display [set]="selectedSet"></card-display>
		</div>
	`,
})
// 7.1.1.17994
export class CollectionStatsComponent implements OnInit {

	private standardSets: Set[];
	private wildSets: Set[];
	private selectedSet: Set;
	// private maxCards = 0;

	constructor(private collectionManager: CollectionManager, private cards: AllCardsService) {
		// console.log('constructor CollectionComponent');
	}

	ngOnInit() {
		this.standardSets = this.cards.getStandardSets();
		this.wildSets = this.cards.getWildSets();
		console.log('sets', this.standardSets, this.wildSets);

		this.collectionManager.getCollection((collection: Card[]) => {
			// Add the number of owned cards on each card in the standard set
			this.standardSets.forEach((standardSet: Set) => {
				this.updateSet(collection, standardSet);
			})
			this.wildSets.forEach((standardSet: Set) => {
				this.updateSet(collection, standardSet);
			})
		})
		console.log('after adding owned cards', this.standardSets);
	}

	private updateSet(collection: Card[], set: Set) {
		set.allCards.forEach((card: SetCard) => {
			let owned = collection.filter((collectionCard: Card) => collectionCard.Id === card.id);
			owned.forEach((collectionCard: Card) => {
				if (collectionCard.Premium) {
					card.ownedPremium = collectionCard.Count;
				}
				else {
					card.ownedNonPremium = collectionCard.Count;
				}
			})
		})

		// this.maxCards = Math.max(this.maxCards, set.numberOfCards());

		set.ownedCards = set.allCards.map((card: SetCard) => card.getNumberCollected()).reduce((c1, c2) => c1 + c2, 0);
	}

	private onSetSelected(set: Set) {
		console.log('handling selected set', set);
		if (this.selectedSet === set) {
			console.log('set was previously selected, hiding');
			this.selectedSet = null;
			return;
		}

		this.selectedSet = set;
	}
}
