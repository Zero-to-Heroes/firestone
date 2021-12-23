import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { GameStat } from '../../../models/mainwindow/stats/game-stat';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';

@Component({
	selector: 'decktracker-stats-for-replays',
	styleUrls: [
		`../../../../css/global/menu.scss`,
		`../../../../css/component/decktracker/main/decktracker-stats-for-replays.component.scss`,
	],
	template: `
		<ul class="global-stats">
			<li class="global-stat {{ stat.class }}" *ngFor="let stat of stats">
				<div class="label">{{ stat.label }}</div>
				<div class="value">{{ stat.value }}</div>
			</li>
		</ul>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DecktrackerStatsForReplaysComponent {
	@Input() set replays(value: readonly GameStat[]) {
		if (value === this._replays) {
			return;
		}
		this._replays = value ?? [];
		this.updateInfos();
	}

	stats: readonly InternalStat[];

	constructor(private readonly i18n: LocalizationFacadeService) {}

	private _replays: readonly GameStat[];

	private updateInfos() {
		const replaysFirst = this._replays.filter((replay) => replay.coinPlay === 'play');
		const replaysCoin = this._replays.filter((replay) => replay.coinPlay === 'coin');
		const replaysWon = this._replays.filter((replay) => replay.result === 'won');
		const turnsToWin =
			replaysWon
				.filter((replay) => replay.gameDurationTurns)
				.map((replay) => replay.gameDurationTurns)
				.reduce((a, b) => a + b, 0) / replaysWon.filter((replay) => replay.gameDurationTurns).length;
		const replaysLost = this._replays.filter((replay) => replay.result === 'lost');
		const turnsToLose =
			replaysLost
				.filter((replay) => replay.gameDurationTurns)
				.map((replay) => replay.gameDurationTurns)
				.reduce((a, b) => a + b, 0) / replaysLost.filter((replay) => replay.gameDurationTurns).length;
		const winrate = (100 * replaysWon.length) / this._replays.length;
		const winrateFirst =
			(100 * replaysFirst.filter((replay) => replay.result === 'won').length) / replaysFirst.length;
		const winrateCoin = (100 * replaysCoin.filter((replay) => replay.result === 'won').length) / replaysCoin.length;

		this.stats = [
			{
				label: this.i18n.translateString('app.decktracker.stats.total-games-played'),
				value: `${this._replays.length?.toLocaleString() ?? '0'}`,
				class: 'games',
			},
			{
				label: this.i18n.translateString('app.decktracker.stats.total-time-played'),
				value: `${this.toAppropriateDurationFromSeconds(
					this._replays.map((replay) => replay.gameDurationSeconds).reduce((a, b) => a + b, 0),
				)}`,
			},
			{
				label: this.i18n.translateString('app.decktracker.stats.turns-to-win'),
				value: `${isNaN(turnsToWin) ? '-' : turnsToWin.toFixed(1)}`,
			},
			{
				label: this.i18n.translateString('app.decktracker.stats.turns-to-lose'),
				value: `${isNaN(turnsToLose) ? '-' : turnsToLose.toFixed(1)}`,
			},
			{
				label: this.i18n.translateString('app.decktracker.stats.winrate'),
				value: `${isNaN(winrate) ? '-' : winrate.toFixed(1)}%`,
				class: 'winrate ',
			},
			{
				label: this.i18n.translateString('app.decktracker.stats.winrate-first'),
				value: `${isNaN(winrateFirst) ? '-' : winrateFirst.toFixed(1)}%`,
				class: 'winrate ',
			},
			{
				label: this.i18n.translateString('app.decktracker.stats.winrate-coin'),
				value: `${isNaN(winrateCoin) ? '-' : winrateCoin.toFixed(1)}%`,
				class: 'winrate ',
			},
		];
	}

	private toAppropriateDurationFromSeconds(durationInSeconds: number): string {
		if (durationInSeconds < 60) {
			return `${durationInSeconds} s`;
		} else if (durationInSeconds < 3600) {
			return `${Math.round(durationInSeconds / 60)} min`;
			// } else if (durationInSeconds < 3600 * 24) {
		} else {
			const hours = Math.floor(durationInSeconds / 3600);
			const min = Math.floor((durationInSeconds - 3600 * hours) / 60);
			const minText = min > 0 ? `${min.toLocaleString().padStart(2, '0')} min` : '';
			return `${hours.toLocaleString()} hours ${minText}`;
		}
		return '';
	}
}

interface InternalStat {
	readonly label: string;
	readonly value: string;
	readonly class?: string;
}
