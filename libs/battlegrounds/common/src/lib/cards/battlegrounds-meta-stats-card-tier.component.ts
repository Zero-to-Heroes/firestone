import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BgsMetaCardStatTier, BgsMetaCardStatTierItem } from '@firestone/battlegrounds/data-access';

@Component({
	selector: 'battlegrounds-meta-stats-card-tier',
	styleUrls: [`./battlegrounds-meta-stats-card-tier.component.scss`],
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
				<battlegrounds-meta-stats-card-info
					class="item-container"
					*ngFor="let item of tier.items; trackBy: trackByFn"
					[stat]="item"
				>
				</battlegrounds-meta-stats-card-info>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsMetaStatsCardTierComponent {
	@Input() tier: BgsMetaCardStatTier;

	trackByFn(index, item: BgsMetaCardStatTierItem) {
		return item.cardId;
	}
}
