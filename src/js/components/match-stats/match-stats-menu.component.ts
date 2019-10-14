import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { MatchStatsCurrentStat } from '../../models/mainwindow/stats/current-stat.type';
import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';
import { ChangeMatchStatCurrentStatEvent } from '../../services/mainwindow/store/events/stats/change-match-stat-current-stat-event';
import { OverwolfService } from '../../services/overwolf.service';

@Component({
	selector: 'match-stats-menu',
	styleUrls: [
		`../../../css/global/components-global.scss`,
		`../../../css/component/match-stats/match-stats-menu.component.scss`,
	],
	template: `
		<ul class="match-stats-menu">
			<li [ngClass]="{ 'selected': selectedMenu === 'replay' }" (mousedown)="selectMenu('replay')">
				<span>Replay</span>
			</li>
			<li [ngClass]="{ 'selected': selectedMenu === 'overview' }" (mousedown)="selectMenu('overview')">
				<span>Overview</span>
			</li>
		</ul>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchStatsMenuComponent implements AfterViewInit {
	@Input() selectedMenu: MatchStatsCurrentStat;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private readonly ow: OverwolfService) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	selectMenu(menu: MatchStatsCurrentStat) {
		this.stateUpdater.next(new ChangeMatchStatCurrentStatEvent(menu));
	}
}
