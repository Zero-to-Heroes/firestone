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
		<div>
			<div class="category-container standard">
				<div class="background"></div>
				<span class="category-title">Standard</span>
				<ul>
					<li *ngFor="let standardSet of standardSets"><set-view [cardSet]="standardSet" [maxCards]="maxCards"></set-view></li>
				</ul>
			</div>
		</div>
	`,
})
// 7.1.1.17994
export class CollectionStatsComponent implements OnInit {

	private standardSets: Set[];
	private maxCards = 0;

	constructor(private collectionManager: CollectionManager, private cards: AllCardsService) {
		console.log('constructor CollectionComponent');
	}

	ngOnInit() {
		console.log('In ngOnInit');

		this.standardSets = this.cards.getStandardSets();
		console.log('standard sets', this.standardSets);

		this.collectionManager.getCollection((collection: Card[]) => {
			// Add the number of owned cards on each card in the standard set
			this.standardSets.forEach((standardSet: Set) => {
				standardSet.allCards.forEach((card: SetCard) => {
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

				this.maxCards = Math.max(this.maxCards, standardSet.numberOfCards());

				standardSet.ownedCards = standardSet.allCards.map((card: SetCard) => card.getNumberCollected()).reduce((c1, c2) => c1 + c2, 0);
			})
		})
		console.log('after adding owned cards', this.standardSets);
	}
}
