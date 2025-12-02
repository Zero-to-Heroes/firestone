import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BgsMetaCardStatTier, BgsMetaCardStatTierItem } from '@firestone/battlegrounds/data-access';

@Component({
	standalone: false,
	selector: 'battlegrounds-meta-stats-card-tier',
	styleUrls: [`./battlegrounds-meta-stats-card-tier.component.scss`],
	template: `
		<div class="tier-section" *ngIf="tier">
			<div
				*ngIf="tier.label"
				class="header {{ tier.label.toLowerCase() }}"
				[helpTooltip]="tier.tooltip"
				[helpTooltipPosition]="'top'"
			>
				{{ tier.label }}
			</div>
			<div class="items">
				<div class="section" *ngFor="let section of tier.sections; trackBy: trackBySectionFn">
					<div class="section-header" *ngIf="section.label && tier.showSectionHeader">
						{{ section.label }}
					</div>
					<div class="section-items">
						<battlegrounds-meta-stats-card-info
							class="item-container"
							*ngFor="let item of section.items; trackBy: trackByFn"
							[stat]="item"
						>
						</battlegrounds-meta-stats-card-info>
					</div>
				</div>
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

	trackBySectionFn(index, section: { label: string; items: readonly BgsMetaCardStatTierItem[] }) {
		return section.label;
	}
}
