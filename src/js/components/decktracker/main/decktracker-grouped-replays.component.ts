import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { DeckReplayInfo } from '../../../models/mainwindow/decktracker/deck-replay-info';
import { GroupedReplays } from '../../../models/mainwindow/decktracker/grouped-replays';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../services/overwolf.service';

@Component({
	selector: 'decktracker-grouped-replays',
	styleUrls: [
		`../../../../css/global/menu.scss`,
		`../../../../css/component/decktracker/main/decktracker-grouped-replays.component.scss`,
	],
	template: `
		<div class="decktracker-grouped-replays">
			<div class="header">{{ header }}</div>
			<ul class="replays">
				<li *ngFor="let replay of _replays">
					<deck-replay-info [replay]="replay"></deck-replay-info>
				</li>
			</ul>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DecktrackerGroupedReplaysComponent implements AfterViewInit {
	header: string;
	_replays: readonly DeckReplayInfo[];

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	@Input() set groupedReplays(value: GroupedReplays) {
		this.header = value.header;
		this._replays = value.replays;
	}

	constructor(private readonly logger: NGXLogger, private ow: OverwolfService) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}
}
