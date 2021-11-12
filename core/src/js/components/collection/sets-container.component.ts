import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { Set } from '../../models/set';

@Component({
	selector: 'sets-container',
	styleUrls: [
		`../../../css/global/scrollbar.scss`,
		`../../../css/component/collection/sets-container.component.scss`,
	],
	template: `
		<div *ngIf="_sets?.length" class="sets-container" scrollable>
			<div class="category-container">
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
export class SetsContainerComponent {
	_sets: Set[];

	@Input() set sets(sets: Set[]) {
		this._sets = sets;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	constructor(private readonly cdr: ChangeDetectorRef) {}

	trackById(index, set: Set) {
		return set.id;
	}
}
