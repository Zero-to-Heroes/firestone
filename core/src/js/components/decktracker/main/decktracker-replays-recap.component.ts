import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MainWindowState } from '../../../models/mainwindow/main-window-state';
import { GameStat } from '../../../models/mainwindow/stats/game-stat';

@Component({
	selector: 'decktracker-replays-recap',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/decktracker/main/decktracker-replays-recap.component.scss`,
	],
	template: `
		<div class="decktracker-replays-recap">
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
export class DecktrackerReplaysRecapComponent {
	@Input() set state(value: MainWindowState) {
		if (value === this._state) {
			return;
		}
		this._state = value;
		this.updateValues();
	}

	_numberOfReplays: number;
	replays: GameStat[];

	private _state: MainWindowState;

	private async updateValues() {
		// console.log('tier updating values', this._state, this._category);
		if (!this._state.decktracker?.decks) {
			return;
		}

		this.replays = (this._state.decktracker.decks
			.map(deck => deck.replays)
			.reduce((a, b) => a.concat(b), []) as GameStat[])
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
