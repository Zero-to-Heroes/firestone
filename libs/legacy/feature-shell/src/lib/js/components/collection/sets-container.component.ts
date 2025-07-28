import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { Set } from '../../models/set';

@Component({
	standalone: false,
	selector: 'sets-container',
	styleUrls: [`../../../css/component/collection/sets-container.component.scss`],
	template: `
		<div *ngIf="_sets?.length" class="sets-container" scrollable>
			<div class="category-container">
				<ol>
					<li *ngFor="let set of _sets; trackBy: trackById">
						<set [cardSet]="set"></set>
					</li>
				</ol>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SetsContainerComponent {
	_sets: readonly Set[];

	@Input() set sets(sets: readonly Set[]) {
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
