import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DecktrackerState } from '../../../models/mainwindow/decktracker/decktracker-state';
import { NavigationState } from '../../../models/mainwindow/navigation/navigation-state';
import { GameStat } from '../../../models/mainwindow/stats/game-stat';
import { Preferences } from '../../../models/preferences';

@Component({
	selector: 'decktracker-replays-recap',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/decktracker/main/decktracker-replays-recap.component.scss`,
	],
	template: `
		<div class="decktracker-replays-recap">
			<div class="title" *ngIf="_numberOfReplays > 0">
				Last {{ _numberOfReplays }} replays
				<replays-icon-toggle class="icon-toggle" [prefs]="prefs"></replays-icon-toggle>
			</div>
			<div class="title" *ngIf="!_numberOfReplays">No replays</div>
			<ul class="list" scrollable>
				<li *ngFor="let replay of replays">
					<replay-info
						[replay]="replay"
						[showStatsLabel]="null"
						[showReplayLabel]="null"
						[prefs]="prefs"
					></replay-info>
				</li>
			</ul>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DecktrackerReplaysRecapComponent {
	@Input() prefs: Preferences;

	@Input() set state(value: DecktrackerState) {
		if (value === this._state) {
			return;
		}
		this._state = value;
		this.updateValues();
	}

	@Input() set navigation(value: NavigationState) {
		if (value === this._navigation) {
			return;
		}
		this._navigation = value;
		this.updateValues();
	}

	_numberOfReplays: number;
	replays: GameStat[];

	private _state: DecktrackerState;
	private _navigation: NavigationState;

	private async updateValues() {
		if (!this._state?.decks || !this._navigation?.navigationDecktracker) {
			return;
		}

		this.replays = (this._state.decks.map((deck) => deck.replays).reduce((a, b) => a.concat(b), []) as GameStat[])
			.filter((stat) =>
				this._navigation.navigationDecktracker.selectedDeckstring
					? stat.playerDecklist === this._navigation.navigationDecktracker.selectedDeckstring
					: true,
			)
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
