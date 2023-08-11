import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { BgsMetaQuestStatTier, BgsMetaQuestStatTierItem } from '@firestone/battlegrounds/data-access';

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
					*ngFor="let item of tier.items; trackBy: trackByFn"
					[stat]="item"
					[collapsed]="isCollapsed(item)"
					(statClicked)="onStatClicked($event)"
				>
				</battlegrounds-meta-stats-quest-info>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsMetaStatsQuestTierComponent {
	@Output() statClicked = new EventEmitter<BgsMetaQuestStatTierItem>();

	@Input() tier: BgsMetaQuestStatTier;
	@Input() collapsedQuests: readonly string[];

	onStatClicked(item: BgsMetaQuestStatTierItem) {
		this.statClicked.next(item);
	}

	isCollapsed(item: BgsMetaQuestStatTierItem): boolean {
		return this.collapsedQuests?.includes(item.cardId);
	}

	trackByFn(index, item: BgsMetaQuestStatTierItem) {
		return item.cardId;
	}
}
