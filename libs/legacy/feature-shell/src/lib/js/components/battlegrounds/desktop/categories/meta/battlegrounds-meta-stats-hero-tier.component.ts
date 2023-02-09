import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BgsMetaHeroStatTier } from '@legacy-import/src/lib/js/services/battlegrounds/bgs-meta-hero-stats';

@Component({
	selector: 'battlegrounds-meta-stats-hero-tier',
	styleUrls: [
		`../../../../../../css/component/battlegrounds/desktop/categories/meta/battlegrounds-meta-stats-hero-tier.component.scss`,
	],
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
				<battlegrounds-meta-stats-hero-info
					class="item-container"
					*ngFor="let item of tier.items"
					[stat]="item"
				>
				</battlegrounds-meta-stats-hero-info>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsMetaStatsHeroTierComponent {
	@Input() tier: BgsMetaHeroStatTier;
}
