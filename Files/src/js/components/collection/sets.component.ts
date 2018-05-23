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
	styleUrls: [
		`../../../css/component/collection/sets.component.scss`,
		`../../../css/global/scrollbar.scss`
	],
	template: `
		<div class="sets">
			<sets-container [sets]="standardSets" [category]="'Standard'" *ngIf="showStandard"></sets-container>
			<sets-container [sets]="wildSets" [category]="'Wild'" *ngIf="showWild"></sets-container>
		</div>
	`,
})
// 7.1.1.17994
export class SetsComponent {

	private showStandard = true;
	private showWild = true;

	private standardSets: Set[];
	private wildSets: Set[];
	private selectedSet: Set;

	constructor(private _events: Events, private collectionManager: CollectionManager, private cards: AllCardsService) {
		overwolf.windows.onStateChanged.addListener((message) => {
			console.log('state changed', message);
			if (message.window_state == 'normal') {
				this.refreshContents();
			}
		});
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

	refreshContents() {
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

		set.ownedLimitCollectibleCards = set.allCards.map((card: SetCard) => card.getNumberCollected()).reduce((c1, c2) => c1 + c2, 0);
		set.ownedLimitCollectiblePremiumCards = set.allCards.map((card: SetCard) => card.getNumberCollectedPremium()).reduce((c1, c2) => c1 + c2, 0);
	}
}
