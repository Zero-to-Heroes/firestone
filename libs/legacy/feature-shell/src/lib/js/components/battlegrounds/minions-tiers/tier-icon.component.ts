import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Tier } from '@firestone/battlegrounds/core';

@Component({
	standalone: false,
	selector: 'tier-icon',
	styleUrls: ['./tier-icon.component.scss'],
	template: `
		<div
			class="tier {{ tier.tavernTier }} {{ additionalClass }}"
			[ngClass]="{ selected: selected }"
			[helpTooltip]="tier.tooltip"
		>
			<img
				class="icon"
				*ngIf="!!tier.tavernTierIcon && !tier.tavernTierIcon.includes('.svg')"
				[src]="tier.tavernTierIcon"
			/>
			<div
				class="icon icon-svg"
				*ngIf="!!tier.tavernTierIcon && tier.tavernTierIcon.includes('.svg')"
				[inlineSVG]="tier.tavernTierIcon"
			></div>
			<div class="number" *ngIf="!tier.tavernTierIcon">{{ tier.tavernTier }}</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsMinionsTierIconComponent {
	@Input() tier: Tier;
	@Input() selected: boolean;
	@Input() additionalClass: string;
}
