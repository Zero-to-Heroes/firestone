import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Tier } from './tiers.model';

@Component({
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
				[src]="
					tier.tavernTierIcon ??
					'https://static.zerotoheroes.com/hearthstone/asset/firestone/images/bgs/star.png'
				"
			/>
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
