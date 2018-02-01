import { Component, Input, Output, EventEmitter } from '@angular/core';

import * as Raven from 'raven-js';

import { CollectionManager } from '../../services/collection-manager.service';
import { AllCardsService } from '../../services/all-cards.service';
import { Events } from '../../services/events.service';

import { Card } from '../../models/card';
import { Set, SetCard } from '../../models/set';

declare var overwolf: any;

@Component({
	selector: 'sets-container',
	styleUrls: [`../../../css/component/collection/sets-container.component.scss`],
	template: `
		<div *ngIf="category" class="sets-container">
			<div class="category-container {{category.toLowerCase()}}">
				<h2 class="category-title">{{category}}</h2>
				<ol>
					<li *ngFor="let set of sets" (click)="selectSet(set)"><set-view [cardSet]="set"></set-view></li>
				</ol>
			</div>
		</div>
	`,
})
// 7.1.1.17994
export class SetsContainer {

	@Input() sets: Set[];
	@Input() category: string;
	// @Output() onSetSelected = new EventEmitter<Set>();
	// private wildSets: Set[];
	// private maxCards = 0;

	constructor(private collectionManager: CollectionManager, private cards: AllCardsService, private _events: Events) {
		// console.log('constructor CollectionComponent');
	}

	selectSet(set: Set) {
		console.log('selected set', set);
		// this.onSetSelected.emit(set);
		this._events.broadcast(Events.SET_SELECTED, set);
	}

	// ngOnInit() {
	// 	this.standardSets = this.cards.getStandardSets();
	// 	this.wildSets = this.cards.getWildSets();
	// 	console.log('sets', this.standardSets, this.wildSets);

	// 	this.collectionManager.getCollection((collection: Card[]) => {
	// 		// Add the number of owned cards on each card in the standard set
	// 		this.standardSets.forEach((standardSet: Set) => {
	// 			this.updateSet(collection, standardSet);
	// 		})
	// 		this.wildSets.forEach((standardSet: Set) => {
	// 			this.updateSet(collection, standardSet);
	// 		})
	// 	})
	// 	console.log('after adding owned cards', this.standardSets);
	// }
}
