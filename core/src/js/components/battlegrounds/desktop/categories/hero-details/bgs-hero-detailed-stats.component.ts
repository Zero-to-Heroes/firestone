import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';

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
					<div class="my-value">{{ gamesPlayed }}</div>
				</div>
				<div class="stat">
					<div class="header">Avg position</div>
					<div class="my-value">{{ buildValue(averagePosition) }}</div>
					<div
						class="global-value"
						[ngClass]="{
							'positive': globalAveragePositionDelta > 0,
							'negative': globalAveragePositionDelta < 0
						}"
					>
						{{ buildValue(globalAveragePositionDelta) }}
					</div>
				</div>
				<div class="stat">
					<div class="header">Top 1%</div>
					<div class="my-value">{{ buildValue(top1) }}</div>
					<div
						class="global-value"
						[ngClass]="{
							'positive': globalTop1Delta > 0,
							'negative': globalTop1Delta < 0
						}"
					>
						{{ buildValue(globalTop1Delta) }}
					</div>
				</div>
				<div class="stat">
					<div class="header">Top 4%</div>
					<div class="my-value">{{ buildValue(top4) }}</div>
					<div
						class="global-value"
						[ngClass]="{
							'positive': globalTop4Delta > 0,
							'negative': globalTop4Delta < 0
						}"
					>
						{{ buildValue(globalTop4Delta) }}
					</div>
				</div>
				<div class="stat">
					<div class="header" helpTooltip="Average MMR gain/loss per match">Net MMR</div>
					<div
						class="my-value"
						[ngClass]="{
							'positive': netMmr > 0,
							'negative': netMmr < 0
						}"
					>
						{{ buildValue(netMmr) }}
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsHeroDetailedStatsComponent {
	_state: MainWindowState;
	_heroId: string;

	gamesPlayed: number;
	averagePosition: number;
	globalAveragePositionDelta: number;
	top1: number;
	globalTop1Delta: number;
	top4: number;
	globalTop4Delta: number;
	netMmr: number;

	@Input() set state(value: MainWindowState) {
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

		const stat = this._state.battlegrounds.stats.heroStats?.find(stat => stat.id === this._heroId);
		if (!stat) {
			return;
		}

		this.gamesPlayed = stat.playerGamesPlayed;
		this.averagePosition = stat.playerAveragePosition;
		this.globalAveragePositionDelta = stat.averagePosition - stat.playerAveragePosition;
		this.top1 = stat.playerTop1;
		this.globalTop1Delta = stat.playerTop1 - stat.top1;
		this.top4 = stat.playerTop4;
		this.globalTop4Delta = stat.playerTop4 - stat.top4;
		this.netMmr = stat.playerAverageMmr;
	}

	buildValue(value: number): string {
		return !value ? 'N/A' : value.toFixed(2);
	}
}
