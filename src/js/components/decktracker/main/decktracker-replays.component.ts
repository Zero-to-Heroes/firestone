import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { GroupedReplays } from '../../../models/mainwindow/decktracker/grouped-replays';
import { ReplaysState } from '../../../models/mainwindow/decktracker/replays-state';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../services/overwolf.service';

@Component({
	selector: 'decktracker-replays',
	styleUrls: [`../../../../css/global/menu.scss`],
	template: `
		<div class="decktracker-replays">
			<ul>
				<li *ngFor="let replay of _replays">
					<decktracker-grouped-replays [groupedReplays]="replay"></decktracker-grouped-replays>
				</li>
			</ul>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DecktrackerReplaysComponent implements AfterViewInit {
	_replays: readonly GroupedReplays[];

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	@Input() set replays(value: ReplaysState) {
		// this.logger.debug('[decktracker-decks] setting decks', value);
		this._replays = value.groupedReplays;
	}

	constructor(private readonly logger: NGXLogger, private ow: OverwolfService) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}
}
