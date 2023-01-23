import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { OverwolfService } from '@firestone/shared/framework/core';
import { DuelsTier, DuelsTierItem } from './duels-tier';

@Component({
	selector: 'duels-tier',
	styleUrls: [`../../../../../css/component/duels/desktop/secondary/duels-tier.component.scss`],
	template: `
		<div class="duels-tier">
			<div class="header {{ label?.toLowerCase() }}" [helpTooltip]="tooltip" [helpTooltipPosition]="'top'">
				{{ label }}
			</div>
			<div class="items">
				<div class="item-container" *ngFor="let item of items">
					<img class="item" [src]="item.icon" [cardTooltip]="item.cardId" [cardTooltipPosition]="'left'" />
					<img [src]="item.secondaryClassIcon" class="secondary-class-icon" *ngIf="item.secondaryClassIcon" />
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsTierComponent {
	@Input() set tier(value: DuelsTier) {
		this.label = value.label;
		this.tooltip = value.tooltip;
		this.items = value.items;
	}

	label: string;
	tooltip: string;
	items: readonly DuelsTierItem[];

	constructor(private readonly ow: OverwolfService) {}
}
