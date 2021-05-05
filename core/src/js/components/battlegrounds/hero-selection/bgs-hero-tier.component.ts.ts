import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BgsHeroStat, BgsHeroTier } from '../../../models/battlegrounds/stats/bgs-hero-stat';

@Component({
	selector: 'bgs-hero-tier',
	styleUrls: [
		`../../../../css/global/reset-styles.scss`,
		`../../../../css/component/battlegrounds/hero-selection/bgs-hero-tier.component.scss`,
	],
	template: `
		<div class="bgs-hero-tier {{ _tier?.toLowerCase() }}">
			<div class="tier {{ _tier?.toLowerCase() }}">
				{{ _tier }}
			</div>
			<div class="heroes">
				<bgs-hero-mini *ngFor="let hero of heroes || []; trackBy: trackByHeroFn" [hero]="hero"></bgs-hero-mini>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsHeroTierComponent {
	_tier: BgsHeroTier;
	heroes: readonly BgsHeroStat[];

	@Input() set tier(value: { tier: BgsHeroTier; heroes: readonly BgsHeroStat[] }) {
		this._tier = value.tier;
		this.heroes = value.heroes;
	}

	trackByHeroFn(index, item: BgsHeroStat) {
		return item.id;
	}
}
