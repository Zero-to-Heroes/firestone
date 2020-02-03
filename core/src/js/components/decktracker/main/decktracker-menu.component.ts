import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { DecktrackerViewType } from '../../../models/mainwindow/decktracker/decktracker-view.type';
import { SelectDecksViewEvent } from '../../../services/mainwindow/store/events/decktracker/select-decks-view-event';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../services/overwolf.service';

@Component({
	selector: 'decktracker-menu',
	styleUrls: [
		`../../../../css/global/menu.scss`,
		`../../../../css/component/decktracker/main/decktracker-menu.component.scss`,
	],
	template: `
		<ng-container [ngSwitch]="displayType">
			<ul *ngSwitchCase="'menu'" class="menu-selection-decktracker menu-selection">
				<li [ngClass]="{ 'selected': currentView === 'decks' }" (click)="goTo('decks')">Decks</li>
				<!--<li [ngClass]="{ 'selected': currentView === 'replays' }" (click)="goTo('replays')">Replays</li>-->
			</ul>
		</ng-container>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DecktrackerMenuComponent implements AfterViewInit {
	@Input() displayType: string;
	@Input() currentView: DecktrackerViewType;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private ow: OverwolfService) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	goTo(newView: DecktrackerViewType) {
		this.stateUpdater.next(new SelectDecksViewEvent(newView));
	}
}
