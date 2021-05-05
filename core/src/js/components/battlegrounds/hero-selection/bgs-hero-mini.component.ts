import { ComponentType } from '@angular/cdk/portal';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BgsHeroStat } from '../../../models/battlegrounds/stats/bgs-hero-stat';
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
			<img [src]="icon" class="portrait" />
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsHeroMiniComponent {
	_hero: BgsHeroStat;
	icon: string;
	componentType: ComponentType<any> = BgsHeroSelectionTooltipComponent;
	@Input() set hero(value: BgsHeroStat) {
		this._hero = value;
		this.icon = `https://static.zerotoheroes.com/hearthstone/fullcard/en/256/battlegrounds/${value.id}.png?v=3`;
	}
}
