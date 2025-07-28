import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	Output,
	ViewRef,
} from '@angular/core';
import { uuid } from '@firestone/shared/framework/common';

@Component({
	standalone: false,
	selector: 'checkbox',
	styleUrls: [`./checkbox.component.scss`],
	template: `
		<div class="checkbox" [ngClass]="{ disabled: disabled }">
			<input type="checkbox" name="checkbox-{{ uniqueId }}" id="checkbox-{{ uniqueId }}" />
			<label
				for="checkbox-{{ uniqueId }}"
				(mousedown)="toggleValue()"
				tabindex="0"
				(keyup)="toggleValueKeyboard($event)"
				[helpTooltip]="labelTooltip"
			>
				<i class="unselected" *ngIf="!value" inlineSVG="assets/svg/unchecked_box.svg"> </i>
				<i class="checked" *ngIf="value" inlineSVG="assets/svg/checked_box.svg"> </i>
				<img class="icon" *ngIf="image" [src]="image" />
				<p>{{ label }}</p>
			</label>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckboxComponent {
	@Output() valueChanged = new EventEmitter<boolean>();

	@Input() label: string;
	@Input() labelTooltip: string;
	@Input() image: string;
	@Input() value: boolean;
	@Input() disabled: boolean;

	uniqueId: string;

	constructor(private cdr: ChangeDetectorRef) {
		this.uniqueId = uuid();
	}

	toggleValueKeyboard(event: KeyboardEvent) {
		if (event.code === 'Space') {
			this.toggleValue();
		}
	}

	async toggleValue() {
		this.value = !this.value;
		this.valueChanged.next(this.value);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
