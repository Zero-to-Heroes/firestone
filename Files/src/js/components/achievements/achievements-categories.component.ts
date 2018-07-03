import { Component, NgZone, OnInit, Input } from '@angular/core';

import * as Raven from 'raven-js';

import { Events } from '../../services/events.service';

declare var overwolf: any;

@Component({
	selector: 'achievements-categories',
	styleUrls: [
		`../../../css/component/achievements/achievements-categories.component.scss`,
		`../../../css/global/scrollbar.scss`
	],
	template: `
		<div class="achievements-categories">
			Here be achievements categories
		</div>
	`,
})
// 7.1.1.17994
export class AchievementsCategoriesComponent {

	private refreshing = false;

	constructor(private _events: Events) {
		overwolf.windows.onStateChanged.addListener((message) => {
			if (message.window_name != "CollectionWindow") {
				return;
			}
			console.log('state changed sets', message);
			if (message.window_state == 'normal') {
				this.refreshContents();
			}
		});
		this.refreshContents();
	}

	refreshContents() {
		if (this.refreshing) {
			return;
		}
		this.refreshing = true;
		// console.log('sets', this.standardSets, this.wildSets);

		// this.collectionManager.getCollection((collection: Card[]) => {
		// 	this.standardSets = this.cards.getStandardSets();
		// 	this.wildSets = this.cards.getWildSets();
		// 	// Add the number of owned cards on each card in the standard set
		// 	this.standardSets.forEach((standardSet: Set) => {
		// 		this.updateSet(collection, standardSet);
		// 	})
		// 	this.wildSets.forEach((standardSet: Set) => {
		// 		this.updateSet(collection, standardSet);
		// 	})
		// 	this.refreshing = false;
		// })
		// console.log('after adding owned cards', this.standardSets);
	}
}
