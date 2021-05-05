import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BgsPlayer } from '../../../models/battlegrounds/bgs-player';
import { BgsPostMatchStats } from '../../../models/battlegrounds/post-match/bgs-post-match-stats';
import { NumericTurnInfo } from '../../../models/battlegrounds/post-match/numeric-turn-info';
import { BgsStats } from '../../../models/battlegrounds/stats/bgs-stats';

@Component({
	selector: 'bgs-chart-warband-stats',
	styleUrls: [
		`../../../../css/global/reset-styles.scss`,
		`../../../../css/component/battlegrounds/post-match/bgs-chart-warband-stats.component.scss`,
	],
	template: `
		<graph-with-comparison
			communityLabel="Average for hero"
			yourLabel="Current run"
			[communityExtractor]="communityExtractor"
			[yourExtractor]="yourExtractor"
			communityTooltip="Average total stats (attack + health) on board at the beginning of each turn's battle (7000+ MMR)"
			yourTooltip="Your values for this run"
		>
		</graph-with-comparison>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsChartWarbandStatsComponent {
	communityExtractor: () => readonly NumericTurnInfo[];
	yourExtractor: () => readonly NumericTurnInfo[];

	private _globalStats: BgsStats;
	private _stats: BgsPostMatchStats;
	private _player: BgsPlayer;

	@Input() set globalStats(value: BgsStats) {
		if (value === this._globalStats) {
			return;
		}
		this._globalStats = value;
		this.updateInfo();
	}

	@Input() set stats(value: BgsPostMatchStats) {
		if (value === this._stats) {
			return;
		}
		this._stats = value;
		this.updateInfo();
	}

	@Input() set player(value: BgsPlayer) {
		if (value === this._player) {
			return;
		}
		this._player = value;
		this.updateInfo();
	}

	private updateInfo() {
		// console.log('updating info');
		if (!this._player || !this._stats || !this._globalStats) {
			return;
		}

		this.communityExtractor = (): readonly NumericTurnInfo[] => {
			if (!this._globalStats.heroStats) {
				return [];
			}

			const warbandStats: readonly NumericTurnInfo[] = this._globalStats.heroStats
				.find((stat) => stat.id === this._player.cardId)
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
			return this._stats.totalStatsOverTurn;
		};
	}
}
