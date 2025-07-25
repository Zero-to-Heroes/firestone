import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { BattleResultHistory } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { BgsMetaHeroStatTierItem } from '@firestone/battlegrounds/data-access';
import { BgsQuestStat, equalNumericTurnInfo, NumericTurnInfo } from '@firestone/game-state';

@Component({
	standalone: false,
	selector: 'bgs-winrate-chart',
	styleUrls: [`../../../../css/component/battlegrounds/post-match/bgs-winrate-chart.component.scss`],
	template: `
		<graph-with-comparison-new
			[turnLabel]="'battlegrounds.post-match-stats.winrate-stats.turn-label' | owTranslate"
			[statLabel]="'battlegrounds.post-match-stats.winrate-stats.winrate-label' | owTranslate"
			[communityValues]="communityValues"
			[yourValues]="yourValues"
			[communityLabel]="'battlegrounds.post-match-stats.warband-stats.community-label' | owTranslate"
			[yourLabel]="'battlegrounds.post-match-stats.warband-stats.your-label' | owTranslate"
			[communityTooltip]="
				'app.battlegrounds.personal-stats.hero-details.winrate-stats.community-tooltip' | owTranslate
			"
			[yourTooltip]="'app.battlegrounds.personal-stats.hero-details.winrate-stats.your-tooltip' | owTranslate"
			[id]="id"
			[maxYValue]="100"
			[stepSize]="50"
			[showYAxis]="showYAxis"
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

	@Input() set heroStat(
		value: { id: string; combatWinrate: readonly { turn: number; winrate: number }[] } | BgsQuestStat,
	) {
		console.debug('[bgs-winrate-chart] heroStat', value);
		if (!value) {
			return;
		}
		const communityValues = (value as BgsMetaHeroStatTierItem).combatWinrate
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
		console.debug('[bgs-winrate-chart] communityValues', communityValues, value);
		if (
			this.communityValues?.length &&
			communityValues?.length &&
			!!this.communityValues?.every((e, ix) => equalNumericTurnInfo(e, communityValues[ix]))
		) {
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
		if (
			this.yourValues?.length &&
			yourValues?.length &&
			!!this.communityValues?.every((e, ix) => equalNumericTurnInfo(e, yourValues[ix]))
		) {
			return;
		}
		this.yourValues = yourValues;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr?.detectChanges();
		}
	}

	constructor(private readonly cdr: ChangeDetectorRef) {}
}
