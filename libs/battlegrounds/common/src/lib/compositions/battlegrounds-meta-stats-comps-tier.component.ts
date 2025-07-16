import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BgsMetaCompStatTier, BgsMetaCompStatTierItem } from './meta-comp.model';

@Component({
	selector: 'battlegrounds-meta-stats-comps-tier',
	styleUrls: [`./battlegrounds-meta-stats-comps-tier.component.scss`],
	template: `
		<div class="tier" *ngIf="tier">
			<div
				*ngIf="tier.label"
				class="header {{ tier.label.toLowerCase() }}"
				[helpTooltip]="tier.tooltip"
				[helpTooltipPosition]="'top'"
			>
				{{ tier.label }}
			</div>
			<div class="items">
				<battlegrounds-meta-stats-comps-info
					class="item-container"
					*ngFor="let item of tier.items; trackBy: trackByFn"
					[stat]="item"
				>
				</battlegrounds-meta-stats-comps-info>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsMetaStatsCompTierComponent {
	@Input() tier: BgsMetaCompStatTier;

	trackByFn(index, item: BgsMetaCompStatTierItem) {
		return item.compId;
	}
}
