import { Component, Input, Output, EventEmitter } from '@angular/core';

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

	constructor(private cards: AllCardsService, private _events: Events) {
	}

	selectSet(set: Set) {
		this._events.broadcast(Events.SET_SELECTED, set);
	}
}
