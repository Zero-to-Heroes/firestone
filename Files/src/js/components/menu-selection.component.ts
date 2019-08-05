import { Component, ChangeDetectionStrategy, ViewEncapsulation, Input, AfterViewInit, EventEmitter } from '@angular/core';

import { MainWindowStoreEvent } from '../services/mainwindow/store/events/main-window-store-event';
import { ChangeVisibleApplicationEvent } from '../services/mainwindow/store/events/change-visible-application-event';
import { OverwolfService } from '../services/overwolf.service';

@Component({
	selector: 'menu-selection',
	styleUrls: [`../../css/global/menu.scss`, `../../css/component/menu-selection.component.scss`],
	template: `
		<ul class="menu-selection">
			<li [ngClass]="{ 'selected': selectedModule === 'collection' }" (mousedown)="selectModule('collection')">
				<span>The Binder</span>
			</li>
			<li [ngClass]="{ 'selected': selectedModule === 'achievements' }" (mousedown)="selectModule('achievements')">
				<span>Achievements</span>
			</li>
			<li [ngClass]="{ 'selected': selectedModule === 'decktracker' }" (mousedown)="selectModule('decktracker')">
				<span>Deck Tracker</span>
			</li>
		</ul>
	`,
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuSelectionComponent implements AfterViewInit {
	@Input() selectedModule: string;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private ow: OverwolfService) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	selectModule(module: string) {
		this.stateUpdater.next(new ChangeVisibleApplicationEvent(module));
	}
}
