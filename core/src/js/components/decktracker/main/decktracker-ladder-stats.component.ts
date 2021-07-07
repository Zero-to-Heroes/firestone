import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input } from '@angular/core';
import { DecktrackerState } from '../../../models/mainwindow/decktracker/decktracker-state';
import { GameStat } from '../../../models/mainwindow/stats/game-stat';
import { classesForPieChart, colorForClass, formatClass } from '../../../services/hs-utils';
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
			<decktracker-stats-for-replays [replays]="replays"></decktracker-stats-for-replays>
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

	@Input() set state(value: DecktrackerState) {
		if (value === this._state) {
			return;
		}
		this._state = value;
		this.updateInfos();
	}

	replays: readonly GameStat[];
	// stats: readonly InternalStat[];
	playerPieChartData: readonly InputPieChartData[];
	opponentPieChartData: readonly InputPieChartData[];
	pieChartOptions: InputPieChartOptions;

	private _state: DecktrackerState;

	constructor(private ow: OverwolfService, private el: ElementRef) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	private updateInfos() {
		if (!this._state?.decks) {
			return;
		}

		this.replays = this._state.decks.map((deck) => deck.replays).reduce((a, b) => a.concat(b), []);
		this.playerPieChartData = this.buildPlayerPieChartData(this.replays);
		this.opponentPieChartData = this.buildOpponentPieChartData(this.replays);
		this.pieChartOptions = this.buildPieChartOptions();
	}

	private buildPieChartOptions(): InputPieChartOptions {
		return {
			padding: {
				top: 0,
				bottom: 50,
				left: 90,
				right: 80,
			},
			showAllLabels: true,
			aspectRatio: 1,
			tooltipFontSize: 16,
		};
	}

	private buildPlayerPieChartData(replays: readonly GameStat[]): readonly InputPieChartData[] {
		return classesForPieChart.map((className) => {
			return {
				label: formatClass(className),
				data: replays.filter((replay) => replay.playerClass === className)?.length ?? 0,
				color: `${colorForClass(className)}`,
			};
		});
	}

	private buildOpponentPieChartData(replays: readonly GameStat[]): readonly InputPieChartData[] {
		return classesForPieChart.map((className) => {
			return {
				label: formatClass(className),
				data: replays.filter((replay) => replay.opponentClass === className)?.length ?? 0,
				color: `${colorForClass(className)}`,
			};
		});
	}
}
