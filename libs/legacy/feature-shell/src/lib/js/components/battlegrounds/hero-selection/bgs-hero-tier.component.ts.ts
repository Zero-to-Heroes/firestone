import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BgsHeroStat, BgsHeroTier, BgsQuestStat } from '../../../models/battlegrounds/stats/bgs-hero-stat';

@Component({
	selector: 'bgs-hero-tier',
	styleUrls: [`../../../../css/component/battlegrounds/hero-selection/bgs-hero-tier.component.scss`],
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
	heroes: readonly (BgsHeroStat | BgsQuestStat)[];

	@Input() set tier(value: { tier: BgsHeroTier; heroes: readonly (BgsHeroStat | BgsQuestStat)[] }) {
		this._tier = value.tier;
		this.heroes = value.heroes;
	}

	trackByHeroFn(index, item: BgsHeroStat | BgsQuestStat) {
		return item.id;
	}
}
