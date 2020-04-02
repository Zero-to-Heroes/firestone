import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BgsHeroOverview } from '../../../models/battlegrounds/hero-selection/bgs-hero-overview';

declare let amplitude: any;

@Component({
	selector: 'bgs-hero-mini',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/battlegrounds/hero-selection/bgs-hero-mini.component.scss`,
	],
	template: `
		<div class="hero-mini">
			<img [src]="icon" class="portrait" />
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsHeroMiniComponent {
	_hero: BgsHeroOverview;
	icon: string;

	@Input() set hero(value: BgsHeroOverview) {
		this._hero = value;
		this.icon = `https://static.zerotoheroes.com/hearthstone/fullcard/en/256/battlegrounds/${value.heroCardId}.png`;
	}
}
