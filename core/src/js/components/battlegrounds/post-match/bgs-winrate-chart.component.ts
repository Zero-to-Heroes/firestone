import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { BattleResultHistory } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { NumericTurnInfo } from '../../../models/battlegrounds/post-match/numeric-turn-info';
import { BgsHeroStat } from '../../../models/battlegrounds/stats/bgs-hero-stat';
import { deepEqual } from '../../../services/utils';

@Component({
	selector: 'bgs-winrate-chart',
	styleUrls: [
		`../../../../css/global/reset-styles.scss`,
		`../../../../css/component/battlegrounds/post-match/bgs-winrate-chart.component.scss`,
	],
	template: `
		<graph-with-comparison-new
			[id]="id"
			[turnLabel]="'battlegrounds.post-match-stats.winrate-stats.turn-label' | owTranslate"
			[statLabel]="'battlegrounds.post-match-stats.winrate-stats.winrate-label' | owTranslate"
			[communityLabel]="'battlegrounds.post-match-stats.warband-stats.community-label' | owTranslate"
			[yourLabel]="'battlegrounds.post-match-stats.warband-stats.your-label' | owTranslate"
			[yourValues]="yourValues"
			[communityValues]="communityValues"
			[maxYValue]="80"
			[stepSize]="50"
			[showYAxis]="showYAxis"
			[communityTooltip]="
				'app.battlegrounds.personal-stats.hero-details.winrate-stats.community-tooltip' | owTranslate
			"
			[yourTooltip]="'app.battlegrounds.personal-stats.hero-details.winrate-stats.your-tooltip' | owTranslate"
		>
		</graph-with-comparison-new>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsWinrateChartComponent {
	communityValues: readonly NumericTurnInfo[];
	yourValues: readonly NumericTurnInfo[];
	id: string;

	@Input() showYAxis = true;

	@Input() set heroStat(value: BgsHeroStat) {
		if (!value) {
			return;
		}
		const communityValues = value.combatWinrate
			?.filter((stat) => stat.turn > 0)
			.filter((stat) => stat.turn <= 13)
			.map((stat) => {
				return {
					turn: stat.turn,
					value: Math.round(stat.winrate),
				} as NumericTurnInfo;
			})
			.filter((stat) => stat)
			.slice(0, 15);
		if (deepEqual(this.communityValues, communityValues)) {
			return;
		}
		this.id = value.id;
		this.communityValues = communityValues;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr?.detectChanges();
		}
	}

	@Input() set battleResultHistory(value: readonly BattleResultHistory[]) {
		if (!value?.length) {
			return;
		}
		const yourValues = value.map(
			(turnInfo) =>
				({
					turn: turnInfo.turn,
					value: turnInfo.simulationResult?.wonPercent || 0,
				} as NumericTurnInfo),
		);
		if (deepEqual(this.yourValues, yourValues)) {
			return;
		}
		this.yourValues = yourValues;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr?.detectChanges();
		}
	}

	constructor(private readonly cdr: ChangeDetectorRef) {}
}
