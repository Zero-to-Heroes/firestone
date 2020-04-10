import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BgsHeroOverview } from '../../../models/battlegrounds/hero-selection/bgs-hero-overview';
import { BgsHeroTier } from '../../../models/battlegrounds/stats/bgs-hero-stat';

declare let amplitude: any;

@Component({
	selector: 'bgs-hero-tier',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/battlegrounds/hero-selection/bgs-hero-tier.component.scss`,
	],
	template: `
		<div class="bgs-hero-tier {{ _tier?.toLowerCase() }}">
			<div class="tier {{ _tier?.toLowerCase() }}">
				{{ _tier }}
			</div>
			<div class="heroes" *ngIf="heroes?.length">
				<bgs-hero-mini *ngFor="let hero of heroes; trackBy: trackByHeroFn" [hero]="hero"></bgs-hero-mini>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsHeroTierComponent {
	_tier: BgsHeroTier;
	heroes: readonly BgsHeroOverview[];

	@Input() set tier(value: { tier: BgsHeroTier; heroes: readonly BgsHeroOverview[] }) {
		this._tier = value.tier;
		this.heroes = value.heroes;
	}

	trackByHeroFn(index, item: BgsHeroOverview) {
		return item.heroCardId;
	}
}
