import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BgsTavernUpgrade } from '../../../models/battlegrounds/in-game/bgs-tavern-upgrade';
import { BgsTriple } from '../../../models/battlegrounds/in-game/bgs-triple';
import { BgsPostMatchStats } from '../../../models/battlegrounds/post-match/bgs-post-match-stats';

declare let amplitude: any;

@Component({
	selector: 'bgs-chart-stats',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/battlegrounds/post-match/bgs-chart-stats.component.scss`,
	],
	template: `
		<div class="stats-container">
			<div class="tavern-upgrades">
				<div *ngFor="let upgrade of tavernUpgrades">
					Turn {{ upgrade.turn }}: Upgrade tier {{ upgrade.tavernTier }}
				</div>
			</div>
			<div class="triple-tiers">
				<div *ngFor="let triple of triples">
					Turn {{ triple.turn }}: One tier {{ triple.tierOfTripledMinion }} triple
				</div>
			</div>
			<div class="other-stats">
				<div class="coins-wasted">
					<div class="label">Coins wasted</div>
					<div class="value">{{ coinsWasted }}</div>
				</div>
				<div class="rerolls">
					<div class="label">Rerolls</div>
					<div class="value">{{ rerolls }}</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsChartStatsComponent {
	tavernUpgrades: readonly BgsTavernUpgrade[];
	triples: readonly BgsTriple[];
	coinsWasted: number;
	rerolls: number;

	@Input() set stats(value: BgsPostMatchStats) {
		this.tavernUpgrades = value.tavernTimings;
		this.triples = value.tripleTimings;
		this.coinsWasted = value.coinsWasted;
		this.rerolls = value.rerolls;
	}
}
