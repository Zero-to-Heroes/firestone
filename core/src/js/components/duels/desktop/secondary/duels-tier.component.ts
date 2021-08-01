import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { OverwolfService } from '../../../../services/overwolf.service';
import { DuelsTier, DuelsTierItem } from './duels-tier';

@Component({
	selector: 'duels-tier',
	styleUrls: [
		`../../../../../css/global/components-global.scss`,
		`../../../../../css/component/duels/desktop/secondary/duels-tier.component.scss`,
	],
	template: `
		<div class="duels-tier">
			<div class="header {{ label?.toLowerCase() }}" [helpTooltip]="tooltip">
				{{ label }}
			</div>
			<div class="items">
				<img class="item" *ngFor="let item of items" [src]="item.icon" [cardTooltip]="item.cardId" />
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
