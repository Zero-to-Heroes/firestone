import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';

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
				<ol>
					<li *ngFor="let set of _sets; trackBy: trackById" (click)="selectSet(set)">
						<set-view [cardSet]="set"></set-view>
					</li>
				</ol>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SetsContainer {

	@Input() _sets: Set[];
	@Input() category: string;

	@Input() set sets(sets: Set[]) {
		console.log('setting new sets', sets);
		this._sets = sets;
	}

	constructor(private cards: AllCardsService, private _events: Events) {
	}

	selectSet(set: Set) {
		this._events.broadcast(Events.SET_SELECTED, set);
	}

	trackById(index, set: Set) {
		return set.id;
	}
}
