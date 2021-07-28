import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BgsPlayer } from '../../../models/battlegrounds/bgs-player';
import { BgsPostMatchStats } from '../../../models/battlegrounds/post-match/bgs-post-match-stats';
import { NumericTurnInfo } from '../../../models/battlegrounds/post-match/numeric-turn-info';
import { BgsStats } from '../../../models/battlegrounds/stats/bgs-stats';

@Component({
	selector: 'bgs-winrate-chart',
	styleUrls: [
		`../../../../css/global/reset-styles.scss`,
		`../../../../css/component/battlegrounds/post-match/bgs-winrate-chart.component.scss`,
	],
	template: `
		<graph-with-comparison
			[id]="id"
			communityLabel="Average for hero"
			yourLabel="Current run"
			[communityExtractor]="communityExtractor"
			[yourExtractor]="yourExtractor"
			[maxYValue]="80"
			[stepSize]="20"
			communityTooltip="Average winrate (the % chance to win a battle) for each run (7000+ MMR)"
			yourTooltip="Your values for this run"
		>
		</graph-with-comparison>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsWinrateChartComponent {
	communityExtractor: () => readonly NumericTurnInfo[];
	yourExtractor: () => readonly NumericTurnInfo[];
	id: string;

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
		this.id = this._player.baseCardId ?? this._player.cardId;
		this.updateInfo();
	}

	private updateInfo() {
		if (!this._player || !this._globalStats) {
			return;
		}
		this.communityExtractor = (): readonly NumericTurnInfo[] => {
			if (!this._globalStats?.heroStats || !this._player?.cardId) {
				return [];
			}

			const result = this._globalStats.heroStats
				.find((stat) => stat.id === (this._player.baseCardId ?? this._player.cardId))
				?.combatWinrate?.filter((stat) => stat.turn > 0)
				.map((stat) => {
					return {
						turn: stat.turn,
						value: stat.winrate,
					} as NumericTurnInfo;
				})
				.filter((stat) => stat);
			return result;
		};
		this.yourExtractor = (): readonly NumericTurnInfo[] => {
			if (!this._stats || !this._stats.battleResultHistory) {
				return [];
			}
			const result = this._stats.battleResultHistory.map(
				(turnInfo) =>
					({
						turn: turnInfo.turn,
						value: turnInfo.simulationResult?.wonPercent || 0,
					} as NumericTurnInfo),
			);
			return result;
		};
	}
}
