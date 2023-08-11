import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BgsMetaQuestRewardStatTier, BgsMetaQuestRewardStatTierItem } from '@firestone/battlegrounds/data-access';

@Component({
	selector: 'battlegrounds-meta-stats-quest-reward-tier',
	styleUrls: [`./battlegrounds-meta-stats-quest-reward-tier.component.scss`],
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
				<battlegrounds-meta-stats-quest-reward-info
					class="item-container"
					*ngFor="let item of tier.items; trackBy: trackByFn"
					[stat]="item"
				>
				</battlegrounds-meta-stats-quest-reward-info>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsMetaStatsQuestRewardTierComponent {
	@Input() tier: BgsMetaQuestRewardStatTier;

	trackByFn(index, item: BgsMetaQuestRewardStatTierItem) {
		return item.cardId;
	}
}
