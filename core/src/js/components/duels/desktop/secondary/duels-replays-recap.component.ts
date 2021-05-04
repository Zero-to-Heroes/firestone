import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MainWindowState } from '../../../../models/mainwindow/main-window-state';
import { GameStat } from '../../../../models/mainwindow/stats/game-stat';
import { PreferencesService } from '../../../../services/preferences.service';

@Component({
	selector: 'duels-replays-recap',
	styleUrls: [
		`../../../../../css/global/components-global.scss`,
		`../../../../../css/component/duels/desktop/secondary/duels-replays-recap.component.scss`,
	],
	template: `
		<div class="duels-replays-recap">
			<div class="title">Last {{ _numberOfReplays }} replays</div>
			<ul class="list">
				<li *ngFor="let replay of replays">
					<replay-info [replay]="replay" [showStatsLabel]="null" [showReplayLabel]="null"></replay-info>
				</li>
			</ul>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsReplaysRecapComponent {
	@Input() set state(value: MainWindowState) {
		if (value === this._state) {
			return;
		}
		this._state = value;
		this.updateValues();
	}

	_numberOfReplays: number;
	replays: GameStat[];

	constructor(private readonly prefs: PreferencesService) {}

	private _state: MainWindowState;

	private updateValues() {
		// console.log('tier updating values', this._state, this._category);
		if (!this._state.duels?.playerStats?.personalDeckStats?.length) {
			return;
		}

		this.replays = this._state.duels.playerStats.personalDeckStats
			.map((deck) => deck.runs)
			.reduce((a, b) => a.concat(b), [])
			.map((run) => run.steps)
			.reduce((a, b) => a.concat(b), [])
			.filter((step) => (step as GameStat).opponentCardId)
			.map((step) => step as GameStat)
			.sort((a: GameStat, b: GameStat) => {
				if (a.creationTimestamp <= b.creationTimestamp) {
					return 1;
				}
				return -1;
			})
			.slice(0, 20);
		this._numberOfReplays = this.replays.length;
	}
}
