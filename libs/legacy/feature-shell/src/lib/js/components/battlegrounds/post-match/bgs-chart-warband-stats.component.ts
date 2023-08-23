import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { BgsPostMatchStats as IBgsPostMatchStats } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { BgsMetaHeroStatTierItem } from '@firestone/battlegrounds/data-access';
import { NumericTurnInfo } from '../../../models/battlegrounds/post-match/numeric-turn-info';
import { deepEqual } from '../../../services/utils';

@Component({
	selector: 'bgs-chart-warband-stats',
	styleUrls: [`../../../../css/component/battlegrounds/post-match/bgs-chart-warband-stats.component.scss`],
	template: `
		<graph-with-comparison-new
			[turnLabel]="'battlegrounds.post-match-stats.warband-stats.turn-label' | owTranslate"
			[statLabel]="'battlegrounds.post-match-stats.warband-stats.stat-label' | owTranslate"
			[deltaLabel]="'battlegrounds.post-match-stats.warband-stats.delta-label' | owTranslate"
			[communityLabel]="'battlegrounds.post-match-stats.warband-stats.community-label' | owTranslate"
			[yourLabel]="'battlegrounds.post-match-stats.warband-stats.your-label' | owTranslate"
			[yourValues]="yourValues"
			[communityValues]="communityValues"
			[showDeltaWithPrevious]="true"
			[communityTooltip]="
				'app.battlegrounds.personal-stats.hero-details.warband-stats.community-tooltip' | owTranslate
			"
			[yourTooltip]="'app.battlegrounds.personal-stats.hero-details.warband-stats.your-tooltip' | owTranslate"
		>
		</graph-with-comparison-new>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsChartWarbandStatsComponent {
	communityValues: readonly NumericTurnInfo[];
	yourValues: readonly NumericTurnInfo[];

	@Input() set heroStat(value: BgsMetaHeroStatTierItem) {
		if (!value) {
			return;
		}
		const communityValues = value.warbandStats
			?.filter((stat) => stat.turn > 0)
			.map((stat) => {
				return {
					turn: stat.turn,
					value: Math.round(stat.averageStats),
				} as NumericTurnInfo;
			})
			.filter((stat) => stat)
			.slice(0, 15);
		if (deepEqual(this.communityValues, communityValues)) {
			return;
		}
		this.communityValues = communityValues;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr?.detectChanges();
		}
	}

	@Input() set stats(value: IBgsPostMatchStats) {
		if (!value) {
			return;
		}
		this.yourValues = value.totalStatsOverTurn;
	}

	constructor(private readonly cdr: ChangeDetectorRef) {}
}
