import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BattlegroundsAppState } from '../../../../../models/mainwindow/battlegrounds/battlegrounds-app-state';

@Component({
	selector: 'bgs-hero-detailed-stats',
	styleUrls: [
		`../../../../../../css/global/components-global.scss`,
		`../../../../../../css/component/battlegrounds/desktop/categories/hero-details/bgs-hero-detailed-stats.component.scss`,
	],
	template: `
		<div class="bgs-hero-detailed-stats">
			<div class="title">General stats</div>
			<div class="content">
				<div class="stat">
					<div class="header">Games played</div>
					<div class="values">
						<div class="my-value">{{ gamesPlayed }}</div>
					</div>
				</div>
				<div class="stat">
					<div class="header">Avg. position</div>
					<div class="values">
						<div class="my-value">{{ buildValue(averagePosition) }}</div>
						<bgs-global-value [value]="buildValue(globalAveragePosition)"></bgs-global-value>
					</div>
				</div>
				<div class="stat">
					<div class="header">Top 1</div>
					<div class="values">
						<div class="my-value">{{ buildValue(top1, 1) }}%</div>
						<bgs-global-value [value]="buildValue(globalTop1, 1) + '%'"></bgs-global-value>
					</div>
				</div>
				<div class="stat">
					<div class="header">Top 4</div>
					<div class="values">
						<div class="my-value">{{ buildValue(top4, 1) }}</div>
						<bgs-global-value [value]="buildValue(globalTop4, 1) + '%'"></bgs-global-value>
					</div>
				</div>
				<div class="stat">
					<div class="header" helpTooltip="Average MMR gain/loss per match">Avg. net MMR</div>
					<div class="values">
						<div
							class="my-value"
							[ngClass]="{
								'positive': netMmr > 0,
								'negative': netMmr < 0
							}"
						>
							{{ buildValue(netMmr, 0) }}
						</div>
					</div>
				</div>
				<div class="stat">
					<div class="header" helpTooltip="Average MMR gain per match">Avg. MMR gain</div>
					<div class="values">
						<div
							class="my-value"
							[ngClass]="{
								'positive': mmrGain > 0,
								'negative': mmrGain < 0
							}"
						>
							{{ buildValue(mmrGain, 0) }}
						</div>
					</div>
				</div>
				<div class="stat">
					<div class="header" helpTooltip="Average MMR loss per match">Avg. MMR loss</div>
					<div class="values">
						<div
							class="my-value "
							[ngClass]="{
								'positive': mmrLoss > 0,
								'negative': mmrLoss < 0
							}"
						>
							{{ buildValue(mmrLoss, 0) }}
						</div>
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsHeroDetailedStatsComponent {
	_state: BattlegroundsAppState;
	_heroId: string;

	gamesPlayed: number;
	averagePosition: number;
	globalAveragePosition: number;
	top1: number;
	globalTop1: number;
	top4: number;
	globalTop4: number;
	netMmr: number;
	mmrGain: number;
	mmrLoss: number;

	@Input() set state(value: BattlegroundsAppState) {
		if (value === this._state) {
			return;
		}
		this._state = value;
		this.updateValues();
	}

	@Input() set heroId(value: string) {
		if (value === this._heroId) {
			return;
		}
		this._heroId = value;
		this.updateValues();
	}

	private updateValues() {
		if (!this._state || !this._heroId) {
			return;
		}

		const stat = this._state.stats.heroStats?.find((stat) => stat.id === this._heroId);
		if (!stat) {
			return;
		}

		this.gamesPlayed = stat.playerGamesPlayed;
		this.averagePosition = stat.playerAveragePosition;
		this.globalAveragePosition = stat.averagePosition;
		this.top1 = stat.playerTop1;
		this.globalTop1 = stat.top1;
		this.top4 = stat.playerTop4;
		this.globalTop4 = stat.top4;
		this.netMmr = stat.playerAverageMmr;
		this.mmrGain = stat.playerAverageMmrGain;
		this.mmrLoss = stat.playerAverageMmrLoss;
	}

	buildValue(value: number, decimals = 2): string {
		if (value === 100) {
			return '100';
		}
		return !value ? '-' : value.toFixed(decimals);
	}
}

@Component({
	selector: 'bgs-global-value',
	styleUrls: [
		`../../../../../../css/global/components-global.scss`,
		`../../../../../../css/component/battlegrounds/desktop/categories/hero-details/bgs-hero-detailed-stats.component.scss`,
	],
	template: `
		<div class="global-value" helpTooltip="Average value for the community">
			<div class="global-icon">
				<svg class="svg-icon-fill">
					<use xlink:href="assets/svg/sprite.svg#global" />
				</svg>
			</div>
			<span class="value">{{ value }}</span>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsGlobalValueComponent {
	@Input() value: string;
}
