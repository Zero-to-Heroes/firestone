import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { MatchDetail } from '../../models/mainwindow/replays/match-detail';
import { ReplaysState } from '../../models/mainwindow/replays/replays-state';
import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../services/overwolf.service';
import { GameStat } from '../../models/mainwindow/stats/game-stat';

@Component({
	selector: 'match-details',
	styleUrls: [`../../../css/component/replays/match-details.component.scss`],
	template: `
		<div class="match-details">
			<replay-info [replay]="replayInfo" *ngIf="replayInfo"></replay-info>
			<game-replay [replay]="selectedReplay"></game-replay>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchDetailsComponent {
	selectedReplay: MatchDetail;
	replayInfo: GameStat;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	@Input() set state(value: ReplaysState) {
		this.selectedReplay = value.selectedReplay;
		this.replayInfo = value.selectedReplay ? value.selectedReplay.replayInfo : null;
	}

	constructor(private readonly logger: NGXLogger, private ow: OverwolfService, private el: ElementRef) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}
}
