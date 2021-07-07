import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BattleResultHistory } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { NumericTurnInfo } from '../../../../../models/battlegrounds/post-match/numeric-turn-info';
import { BattlegroundsAppState } from '../../../../../models/mainwindow/battlegrounds/battlegrounds-app-state';
import { BattlegroundsPersonalStatsHeroDetailsCategory } from '../../../../../models/mainwindow/battlegrounds/categories/battlegrounds-personal-stats-hero-details-category';

@Component({
	selector: 'bgs-winrate-stats-for-hero',
	styleUrls: [
		`../../../../../../css/global/reset-styles.scss`,
		`../../../../../../css/component/battlegrounds/desktop/categories/hero-details/bgs-winrate-stats-for-hero.component.scss`,
	],
	template: `
		<graph-with-comparison
			[communityExtractor]="communityExtractor"
			[yourExtractor]="yourExtractor"
			communityTooltip="Average winrate (% chance to win a battle) per turn for this hero (top4 6000+ MMR)"
			yourTooltip="Your values for this hero"
		>
		</graph-with-comparison>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsWinrateStatsForHeroComponent {
	communityExtractor: () => readonly NumericTurnInfo[];
	yourExtractor: () => readonly NumericTurnInfo[];

	@Input() set state(value: BattlegroundsAppState) {
		if (value === this._state) {
			return;
		}
		this._state = value;
		// console.log('setting state', this._state);
		this.buildExtractors();
	}

	@Input() set category(value: BattlegroundsPersonalStatsHeroDetailsCategory) {
		if (value === this._category) {
			return;
		}
		this._category = value;
		this.buildExtractors();
	}

	private _state: BattlegroundsAppState;
	private _category: BattlegroundsPersonalStatsHeroDetailsCategory;

	private buildExtractors() {
		if (!this._state || !this._category) {
			return;
		}

		this.communityExtractor = (): readonly NumericTurnInfo[] => {
			if (!this._state?.stats?.heroStats) {
				return [];
			}

			return this._state.stats.heroStats
				.find((stat) => stat.id === this._category.heroId)
				?.combatWinrate?.filter((stat) => stat.turn > 0)
				?.map((stat) => {
					return {
						turn: stat.turn,
						value: stat.winrate,
					} as NumericTurnInfo;
				})
				.filter((stat) => stat);
		};

		this.yourExtractor = (): readonly NumericTurnInfo[] => {
			if (!this._state?.lastHeroPostMatchStats) {
				return [];
			}

			const heroStatsOverTurn: (readonly BattleResultHistory[])[] = this._state.lastHeroPostMatchStats
				.map((postMatch) => postMatch.stats.battleResultHistory)
				.filter((stats) => stats && stats.length) as (readonly BattleResultHistory[])[];
			// console.log('heroStatsOverTurn', heroStatsOverTurn);
			const maxTurn = Math.max(...heroStatsOverTurn.map((stats) => stats[stats.length - 1].turn));
			if (maxTurn <= 0) {
				return [];
			}

			const result = [...Array(maxTurn).keys()]
				.filter((turn) => turn > 0)
				.map((turn) => {
					const statsForTurn = heroStatsOverTurn
						.map((stats) => stats.find((stat) => stat.turn === turn))
						.filter((stat) => stat)
						.filter((stat) => stat.simulationResult.wonPercent != null)
						.map((stat) => stat.simulationResult.wonPercent);
					// console.log('statsForTurn', turn, statsForTurn);
					return {
						turn: turn,
						value:
							statsForTurn.length > 0
								? statsForTurn.reduce((a, b) => a + b, 0) / statsForTurn.length
								: null,
					};
				});

			// console.log('your winrate', result);
			return result;
		};
	}
}
