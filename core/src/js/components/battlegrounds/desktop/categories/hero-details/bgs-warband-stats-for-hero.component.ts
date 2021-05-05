import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NumericTurnInfo } from '../../../../../models/battlegrounds/post-match/numeric-turn-info';
import { BattlegroundsPersonalStatsHeroDetailsCategory } from '../../../../../models/mainwindow/battlegrounds/categories/battlegrounds-personal-stats-hero-details-category';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';

@Component({
	selector: 'bgs-warband-stats-for-hero',
	styleUrls: [
		`../../../../../../css/global/reset-styles.scss`,
		`../../../../../../css/component/battlegrounds/desktop/categories/hero-details/bgs-warband-stats-for-hero.component.scss`,
	],
	template: `
		<graph-with-comparison
			[communityExtractor]="communityExtractor"
			[yourExtractor]="yourExtractor"
			communityTooltip="Average total stats (attack + health) on board at the beginning of each turn battle (top4 6000+ MMR)"
			yourTooltip="Your values for this hero"
		>
		</graph-with-comparison>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsWarbandStatsForHeroComponent {
	communityExtractor: () => readonly NumericTurnInfo[];
	yourExtractor: () => readonly NumericTurnInfo[];

	@Input() set state(value: MainWindowState) {
		if (value === this._state) {
			return;
		}
		this._state = value;
		this.buildExtractors();
	}

	@Input() set category(value: BattlegroundsPersonalStatsHeroDetailsCategory) {
		if (value === this._category) {
			return;
		}
		this._category = value;
		this.buildExtractors();
	}

	private _state: MainWindowState;
	private _category: BattlegroundsPersonalStatsHeroDetailsCategory;

	private buildExtractors() {
		if (!this._state || !this._category) {
			return;
		}

		this.communityExtractor = (): readonly NumericTurnInfo[] => {
			if (!this._state.battlegrounds?.lastHeroPostMatchStats) {
				return [];
			}

			// const averageStats: readonly {
			// 	turn: number;
			// 	totalStats: number;
			// }[] = this._state.battlegrounds.stats.heroStats.find(stat => stat.id === 'average')?.warbandStats;
			const warbandStats: readonly NumericTurnInfo[] = this._state.battlegrounds.stats.heroStats
				.find((stat) => stat.id === this._category.heroId)
				?.warbandStats?.map(
					(stat) =>
						({
							turn: stat.turn,
							value: stat.totalStats,
						} as NumericTurnInfo),
				)
				.filter((stat) => stat);
			return warbandStats;
		};

		this.yourExtractor = (): readonly NumericTurnInfo[] => {
			if (!this._state.battlegrounds?.lastHeroPostMatchStats) {
				return [];
			}

			const heroStatsOverTurn: (readonly NumericTurnInfo[])[] = this._state.battlegrounds.lastHeroPostMatchStats
				.map((postMatch) => postMatch.stats.totalStatsOverTurn)
				.filter((stats) => stats && stats.length) as (readonly NumericTurnInfo[])[];
			const maxTurn = Math.max(...heroStatsOverTurn.map((stats) => stats[stats.length - 1].turn));
			if (maxTurn <= 0) {
				return [];
			}
			const heroStats: readonly NumericTurnInfo[] = [...Array(maxTurn).keys()]
				.map((turn) => {
					const statsForTurn = heroStatsOverTurn
						.map((stats) => (stats.length > turn ? stats[turn] : null))
						.filter((stat) => stat)
						.map((stat) => stat.value);
					return statsForTurn.length > 0
						? {
								turn: turn,
								value: statsForTurn.reduce((a, b) => a + b, 0) / statsForTurn.length,
						  }
						: null;
				})
				.filter((info) => info);
			return heroStats;
		};
	}
}
