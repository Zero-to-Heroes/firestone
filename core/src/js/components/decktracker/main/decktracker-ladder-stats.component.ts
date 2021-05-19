import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input } from '@angular/core';
import { MainWindowState } from '../../../models/mainwindow/main-window-state';
import { GameStat } from '../../../models/mainwindow/stats/game-stat';
import { classes, colorForClass, formatClass } from '../../../services/hs-utils';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../services/overwolf.service';
import { InputPieChartData, InputPieChartOptions } from '../../common/chart/input-pie-chart-data';

@Component({
	selector: 'decktracker-ladder-stats',
	styleUrls: [
		`../../../../css/global/menu.scss`,
		`../../../../css/component/decktracker/main/decktracker-ladder-stats.component.scss`,
	],
	template: `
		<div class="decktracker-ladder-stats">
			<ul class="global-stats">
				<li class="global-stat" *ngFor="let stat of stats">
					<div class="label">{{ stat.label }}</div>
					<div class="value">{{ stat.value }}</div>
				</li>
			</ul>
			<div class="graphs">
				<div class="graph player-popularity">
					<div class="title">Player class breakdown</div>
					<pie-chart
						class="chart player-popularity-chart "
						[data]="playerPieChartData"
						[options]="pieChartOptions"
					></pie-chart>
				</div>
				<div class="graph opponents-popularity">
					<div class="title">Opponent class breakdown</div>
					<pie-chart
						class="chart opponents-popularity-chart"
						[data]="opponentPieChartData"
						[options]="pieChartOptions"
					></pie-chart>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DecktrackerLadderStatsComponent implements AfterViewInit {
	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	@Input() set state(value: MainWindowState) {
		if (value === this._state) {
			return;
		}
		this._state = value;
		this.updateInfos();
	}

	stats: readonly InternalStat[];
	playerPieChartData: readonly InputPieChartData[];
	opponentPieChartData: readonly InputPieChartData[];
	pieChartOptions: InputPieChartOptions;

	private _state: MainWindowState;

	constructor(private ow: OverwolfService, private el: ElementRef) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	private updateInfos() {
		if (!this._state?.decktracker?.decks) {
			return;
		}

		const replays = this._state.decktracker.decks.map((deck) => deck.replays).reduce((a, b) => a.concat(b), []);
		const replaysFirst = replays.filter((replay) => replay.coinPlay === 'play');
		const replaysCoin = replays.filter((replay) => replay.coinPlay === 'coin');
		const replaysWon = replays.filter((replay) => replay.result === 'won');
		const turnsToWin =
			replaysWon
				.filter((replay) => replay.gameDurationTurns)
				.map((replay) => replay.gameDurationTurns)
				.reduce((a, b) => a + b, 0) / replaysWon.filter((replay) => replay.gameDurationTurns).length;
		const replaysLost = replays.filter((replay) => replay.result === 'lost');
		const turnsToLose =
			replaysLost
				.filter((replay) => replay.gameDurationTurns)
				.map((replay) => replay.gameDurationTurns)
				.reduce((a, b) => a + b, 0) / replaysLost.filter((replay) => replay.gameDurationTurns).length;

		this.stats = [
			{
				label: 'Total games played',
				value: `${replays.length.toLocaleString()}`,
			},
			{
				label: 'Total time played',
				value: `${this.toAppropriateDurationFromSeconds(
					replays.map((replay) => replay.gameDurationSeconds).reduce((a, b) => a + b, 0),
				)}`,
			},
			{
				label: 'Turns to win',
				value: `${turnsToWin.toFixed(1)}`,
			},
			{
				label: 'Turns to lose',
				value: `${turnsToLose.toFixed(1)}`,
			},
			{
				label: 'Winrate',
				value: `${((100 * replaysWon.length) / replays.length).toFixed(1)}%`,
			},
			{
				label: 'Winrate (first)',
				value: `${(
					(100 * replaysFirst.filter((replay) => replay.result === 'won').length) /
					replaysFirst.length
				).toFixed(1)}%`,
			},
			{
				label: 'Winrate (coin)',
				value: `${(
					(100 * replaysCoin.filter((replay) => replay.result === 'won').length) /
					replaysCoin.length
				).toFixed(1)}%`,
			},
		];
		this.playerPieChartData = this.buildPlayerPieChartData(replays);
		this.opponentPieChartData = this.buildOpponentPieChartData(replays);
		this.pieChartOptions = this.buildPieChartOptions();
	}

	private buildPieChartOptions(): InputPieChartOptions {
		return {
			padding: {
				top: 50,
				bottom: 50,
				left: 0,
				right: 0,
			},
			showAllLabels: true,
			aspectRatio: 1,
		};
	}

	private buildPlayerPieChartData(replays: readonly GameStat[]): readonly InputPieChartData[] {
		return classes.map((className) => {
			return {
				label: formatClass(className),
				data: replays.filter((replay) => replay.playerClass === className)?.length ?? 0,
				color: `${colorForClass(className)}`,
			};
		});
	}

	private buildOpponentPieChartData(replays: readonly GameStat[]): readonly InputPieChartData[] {
		return classes.map((className) => {
			return {
				label: formatClass(className),
				data: replays.filter((replay) => replay.opponentClass === className)?.length ?? 0,
				color: `${colorForClass(className)}`,
			};
		});
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
}
