import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { GroupedReplays } from '../../models/mainwindow/replays/grouped-replays';
import { GameStat } from '../../models/mainwindow/stats/game-stat';
import { Preferences } from '../../models/preferences';
import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../services/overwolf.service';

@Component({
	selector: 'grouped-replays',
	styleUrls: [`../../../css/global/menu.scss`, `../../../css/component/replays/grouped-replays.component.scss`],
	template: `
		<div class="grouped-replays">
			<div class="header">{{ header }}</div>
			<ul class="replays">
				<li *ngFor="let replay of _replays">
					<replay-info [replay]="replay" [prefs]="_prefs"></replay-info>
				</li>
			</ul>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupedReplaysComponent implements AfterViewInit {
	@Input() set groupedReplays(value: GroupedReplays) {
		this.header = value.header;
		this._replays = value.replays;
	}

	@Input() set prefs(value: Preferences) {
		if (!value || value === this.prefs) {
			return;
		}
		this._prefs = value;
	}

	header: string;
	_replays: readonly GameStat[];
	_prefs: Preferences;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private ow: OverwolfService) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}
}
