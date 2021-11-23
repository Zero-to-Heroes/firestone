import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { BgsPostMatchStats } from '../../../models/battlegrounds/post-match/bgs-post-match-stats';
import { NumericTurnInfo } from '../../../models/battlegrounds/post-match/numeric-turn-info';
import { BgsHeroStat } from '../../../models/battlegrounds/stats/bgs-hero-stat';
import { areDeepEqual } from '../../../services/utils';

@Component({
	selector: 'bgs-chart-warband-stats',
	styleUrls: [
		`../../../../css/global/reset-styles.scss`,
		`../../../../css/component/battlegrounds/post-match/bgs-chart-warband-stats.component.scss`,
	],
	template: `
		<graph-with-comparison-new
			communityLabel="Average for hero"
			yourLabel="Current run"
			[yourValues]="yourValues"
			[communityValues]="communityValues"
			[showDeltaWithPrevious]="true"
			communityTooltip="Average total stats (attack + health) on board at the beginning of each turn's battle (7000+ MMR)"
			yourTooltip="Your values for this run"
		>
		</graph-with-comparison-new>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsChartWarbandStatsComponent {
	communityValues: readonly NumericTurnInfo[];
	yourValues: readonly NumericTurnInfo[];

	@Input() set heroStat(value: BgsHeroStat) {
		if (!value) {
			return;
		}
		const communityValues = value.warbandStats
			?.filter((stat) => stat.turn > 0)
			.map((stat) => {
				return {
					turn: stat.turn,
					value: Math.round(stat.totalStats),
				} as NumericTurnInfo;
			})
			.filter((stat) => stat)
			.slice(0, 15);
		if (areDeepEqual(this.communityValues, communityValues)) {
			return;
		}
		console.debug('setting heroStat', value.name, communityValues, this.communityValues, value);
		this.communityValues = communityValues;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr?.detectChanges();
		}
	}

	@Input() set stats(value: BgsPostMatchStats) {
		if (!value) {
			return;
		}
		this.yourValues = value.totalStatsOverTurn;
	}

	constructor(private readonly cdr: ChangeDetectorRef) {}
}
