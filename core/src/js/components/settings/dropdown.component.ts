import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { IOption } from 'ng-select';

@Component({
	selector: 'dropdown',
	styleUrls: [
		'../../../css/global/components-global.scss',
		`../../../css/themes/battlegrounds-theme.scss`,
		'../../../css/component/settings/dropdown.component.scss',
	],
	template: `
		<div class="dropdown" [ngClass]="{ 'disabled': disabled }">
			<label class="label" [helpTooltip]="labelTooltip">{{ label }}</label>
			<filter-dropdown
				class="hero-sort-filter"
				[filter]="value"
				[options]="options"
				[placeholder]="getPlaceholder()"
				[visible]="true"
				(onOptionSelected)="onSelected($event)"
			></filter-dropdown>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DropdownComponent {
	@Output() valueChanged = new EventEmitter<string>();

	@Input() label: string;
	@Input() labelTooltip: string;
	@Input() options: readonly IOption[];
	@Input() value: string;
	@Input() disabled: boolean;

	onSelected(option: IOption) {
		this.valueChanged.next(option.value);
	}

	getPlaceholder() {
		if (!this.options?.length) {
			return null;
		}
		return (this.options.find((o) => o.value === this.value) ?? this.options[0]).label;
	}
}

export interface DropdownOption extends IOption {
	readonly tooltip?: string;
}
