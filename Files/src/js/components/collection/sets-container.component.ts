import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

import { Set } from '../../models/set';

@Component({
	selector: 'sets-container',
	styleUrls: [`../../../css/component/collection/sets-container.component.scss`],
	template: `
		<div *ngIf="category" class="sets-container">
			<div class="category-container {{category.toLowerCase()}}">
				<ol>
					<li *ngFor="let set of _sets; trackBy: trackById">
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

	trackById(index, set: Set) {
		return set.id;
	}
}
