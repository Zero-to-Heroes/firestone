import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DuelsState } from '../../../../models/duels/duels-state';
import { NavigationReplays } from '../../../../models/mainwindow/navigation/navigation-replays';
import { GameStat } from '../../../../models/mainwindow/stats/game-stat';
import { PreferencesService } from '../../../../services/preferences.service';

@Component({
	selector: 'duels-replays-recap-for-run',
	styleUrls: [
		`../../../../../css/global/components-global.scss`,
		`../../../../../css/component/duels/desktop/secondary/duels-replays-recap.component.scss`,
		`../../../../../css/component/duels/desktop/secondary/duels-replays-recap-for-run.component.scss`,
	],
	template: `
		<div class="duels-replays-recap">
			<div class="title">Replays for the same run</div>
			<ul class="list">
				<li *ngFor="let replay of replays">
					<replay-info [replay]="replay" [showStatsLabel]="null" [showReplayLabel]="null"></replay-info>
				</li>
			</ul>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsReplaysRecapForRunComponent {
	@Input() set state(value: DuelsState) {
		if (value === this._state) {
			return;
		}
		this._state = value;
		this.updateValues();
	}

	@Input() set navigation(value: NavigationReplays) {
		if (value === this._navigation) {
			return;
		}
		this._navigation = value;
		this.updateValues();
	}

	_numberOfReplays: number;
	replays: GameStat[];

	private _state: DuelsState;
	private _navigation: NavigationReplays;

	constructor(private readonly prefs: PreferencesService) {}

	private updateValues() {
		console.log('getting replays for run?', this._state, this._navigation);
		if (!this._state?.personalDeckStats?.length || !this._navigation) {
			return;
		}

		const runId = this._navigation?.selectedReplay?.replayInfo?.runId;
		if (!runId) {
			return;
		}

		// console.log('getting replays for run', runId, this._state, this._navigation);
		this.replays = this._state.personalDeckStats
			.map((deck) => deck.runs)
			.reduce((a, b) => a.concat(b), [])
			.filter((run) => run.id === runId)
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
