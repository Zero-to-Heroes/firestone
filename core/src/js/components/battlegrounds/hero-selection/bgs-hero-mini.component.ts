import { ComponentType } from '@angular/cdk/portal';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { GameType } from '@firestone-hs/reference-data';
import { BgsHeroStat } from '../../../models/battlegrounds/stats/bgs-hero-stat';
import { defaultStartingHp } from '../../../services/hs-utils';
import { BgsHeroSelectionTooltipComponent } from './bgs-hero-selection-tooltip.component';

@Component({
	selector: 'bgs-hero-mini',
	styleUrls: [
		`../../../../css/global/reset-styles.scss`,
		`../../../../css/component/battlegrounds/hero-selection/bgs-hero-mini.component.scss`,
	],
	template: `
		<div
			class="hero-mini"
			componentTooltip
			[componentType]="componentType"
			[componentInput]="_hero"
			componentTooltipPosition="left"
		>
			<!-- <img [src]="icon" class="portrait" /> -->
			<bgs-hero-portrait
				class="portrait"
				[heroCardId]="heroCardId"
				[health]="heroStartingHealth"
			></bgs-hero-portrait>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsHeroMiniComponent {
	componentType: ComponentType<any> = BgsHeroSelectionTooltipComponent;

	_hero: BgsHeroStat;
	// icon: string;
	heroCardId: string;
	heroStartingHealth: number;

	@Input() set hero(value: BgsHeroStat) {
		this._hero = value;
		this.heroCardId = value.id;
		this.heroStartingHealth = defaultStartingHp(GameType.GT_BATTLEGROUNDS, value.id);
	}
}
