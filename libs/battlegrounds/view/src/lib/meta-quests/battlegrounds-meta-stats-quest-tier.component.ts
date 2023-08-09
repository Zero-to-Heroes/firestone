import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BgsMetaQuestStatTier } from '@firestone/battlegrounds/data-access';

@Component({
	selector: 'battlegrounds-meta-stats-quest-tier',
	styleUrls: [`./battlegrounds-meta-stats-quest-tier.component.scss`],
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
				<battlegrounds-meta-stats-quest-info
					class="item-container"
					*ngFor="let item of tier.items"
					[stat]="item"
				>
				</battlegrounds-meta-stats-quest-info>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsMetaStatsQuestTierComponent {
	@Input() tier: BgsMetaQuestStatTier;
}
