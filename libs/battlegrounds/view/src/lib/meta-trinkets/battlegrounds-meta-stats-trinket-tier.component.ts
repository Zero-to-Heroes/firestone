import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BgsMetaTrinketStatTier, BgsMetaTrinketStatTierItem } from '@firestone/battlegrounds/data-access';

@Component({
	selector: 'battlegrounds-meta-stats-trinket-tier',
	styleUrls: [`./battlegrounds-meta-stats-trinket-tier.component.scss`],
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
				<battlegrounds-meta-stats-trinket-info
					class="item-container"
					*ngFor="let item of tier.items; trackBy: trackByFn"
					[stat]="item"
				>
				</battlegrounds-meta-stats-trinket-info>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsMetaStatsTrinketTierComponent {
	@Input() tier: BgsMetaTrinketStatTier;

	trackByFn(index, item: BgsMetaTrinketStatTierItem) {
		return item.cardId;
	}
}
