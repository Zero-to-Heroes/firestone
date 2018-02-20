import { Component, NgZone, OnInit, Input } from '@angular/core';

import * as Raven from 'raven-js';

import { CollectionManager } from '../../services/collection/collection-manager.service';
import { AllCardsService } from '../../services/all-cards.service';
import { Events } from '../../services/events.service';

import { Card } from '../../models/card';
import { Set, SetCard } from '../../models/set';

declare var overwolf: any;

@Component({
	selector: 'sets',
	styleUrls: [`../../../css/component/collection/sets.component.scss`],
	template: `
		<div class="sets">
			<sets-container [sets]="standardSets" [category]="'Standard'" *ngIf="showStandard"></sets-container>
			<sets-container [sets]="wildSets" [category]="'Wild'" *ngIf="showWild"></sets-container>
		</div>
	`,
})
// 7.1.1.17994
export class SetsComponent implements OnInit {

	private showStandard = true;
	private showWild = true;

	private standardSets: Set[];
	private wildSets: Set[];
	private selectedSet: Set;
	// private maxCards = 0;

	constructor(private _events: Events, private collectionManager: CollectionManager, private cards: AllCardsService) {

	}

	@Input('selectedFormat') set selectedFormat(format: string) {
		// console.log('showing selected format', format);
		switch (format) {
			case 'standard':
				this.showStandard = true;
				this.showWild = false;
				break;
			case 'wild':
				this.showStandard = false;
				this.showWild = true;
				break;
			default:
				this.showStandard = true;
				this.showWild = true;
		}
	}

	ngOnInit() {
		this.standardSets = this.cards.getStandardSets();
		this.wildSets = this.cards.getWildSets();
		// console.log('sets', this.standardSets, this.wildSets);

		this.collectionManager.getCollection((collection: Card[]) => {
			// Add the number of owned cards on each card in the standard set
			this.standardSets.forEach((standardSet: Set) => {
				this.updateSet(collection, standardSet);
			})
			this.wildSets.forEach((standardSet: Set) => {
				this.updateSet(collection, standardSet);
			})
		})
		// console.log('after adding owned cards', this.standardSets);
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

	// private onSetSelected(set: Set) {
	// 	console.log('handling selected set', set);
	// 	if (this.selectedSet === set) {
	// 		console.log('set was previously selected, hiding');
	// 		this.selectedSet = null;
	// 		return;
	// 	}

	// 	this.selectedSet = set;
	// }
}
