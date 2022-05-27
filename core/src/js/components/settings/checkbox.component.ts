import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	Output,
	ViewRef,
} from '@angular/core';
import { uuid } from '../../services/utils';

@Component({
	selector: 'checkbox',
	styleUrls: [
		`../../../css/global/components-global.scss`,
		`../../../css/component/settings/settings-common.component.scss`,
		`../../../css/component/settings/checkbox.component.scss`,
	],
	template: `
		<div class="checkbox" [ngClass]="{ 'disabled': disabled }">
			<input type="checkbox" name="checkbox-{{ uniqueId }}" id="checkbox-{{ uniqueId }}" />
			<label
				for="checkbox-{{ uniqueId }}"
				(mousedown)="toggleValue()"
				tabindex="0"
				(keyup)="toggleValueKeyboard($event)"
				[helpTooltip]="labelTooltip"
			>
				<i class="unselected" *ngIf="!value">
					<svg>
						<use xlink:href="assets/svg/sprite.svg#unchecked_box" />
					</svg>
				</i>
				<i class="checked" *ngIf="value">
					<svg>
						<use xlink:href="assets/svg/sprite.svg#checked_box" />
					</svg>
				</i>
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
