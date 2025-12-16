import { ComponentType } from '@angular/cdk/overlay';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CounterInstance } from './_counter-definition-v2';

@Component({
	standalone: false,
	selector: 'grouped-counters-element',
	styleUrls: ['./grouped-counters-element.component.scss'],
	template: `
		<div
			class="grouped-counters-element {{ side }}"
			[helpTooltip]="tooltip"
			cardTooltip
			[cardTooltipRelatedCardIds]="cardTooltip"
			componentTooltip
			[componentType]="advancedTooltipType"
			[componentInput]="advancedTooltipInput"
			[componentTooltipPosition]="'left'"
		>
			<div class="icon">
				<img [src]="icon" />
			</div>
			<div class="value">
				{{ value }}
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupedCountersElementComponent {
	advancedTooltipType: ComponentType<any> | undefined;
	advancedTooltipInput: any | undefined;

	icon: string;
	tooltip: string | null;
	value: string | number;
	cardTooltip: readonly string[] | undefined;

	@Input() set counter(value: CounterInstance<any>) {
		this.icon = value.image;
		this.tooltip = value.tooltip;
		this.value = value.value ?? '-';
		this.cardTooltip = value.cardTooltip;

		this.advancedTooltipType = value.advancedTooltipType;
		this.advancedTooltipInput = value.advancedTooltipInput;
	}
	@Input() side: 'player' | 'opponent';
}
