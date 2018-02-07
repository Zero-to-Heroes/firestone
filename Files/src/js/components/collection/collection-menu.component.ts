import { Component, HostListener, Input } from '@angular/core';

import { Set } from '../../models/set';
import { Events } from '../../services/events.service';

declare var overwolf: any;

@Component({
	selector: 'collection-menu',
	styleUrls: [
		`../../../css/global/menu.scss`,
		`../../../css/component/collection/collection-menu.component.scss`,
	],
	template: `
		<ng-container [ngSwitch]="displayType">
			<ul *ngSwitchCase="'menu'" class="menu-selection">
				<li class="selected" (click)="goToCollectionView()">Sets</li>
				<li>Cards</li>
			</ul>
			<ng-container *ngSwitchCase="'breadcrumbs'" >
				<ul class="breadcrumbs">
					<li (click)="goToCollectionView()">Sets</li>
					<li (click)="goToFormatView()">{{selectedFormat}}</li>
					<li (click)="goToSetView()" *ngIf="selectedSet">{{selectedSet.name}}</li>
				</ul>
			</ng-container>
		</ng-container>
	`,
})

export class CollectionMenuComponent {

	@Input() public displayType: string;
	@Input() public selectedSet: Set;
	@Input() public selectedFormat: string;

	constructor(private _events: Events) {

	}
	private goToSetView() {
		this._events.broadcast(Events.SET_SELECTED, this.selectedSet);
	}

	private goToFormatView() {
		this._events.broadcast(Events.FORMAT_SELECTED, this.selectedSet.standard ? 'standard' : 'wild');
	}

	private goToCollectionView() {
		this._events.broadcast(Events.MODULE_SELECTED, 'collection');
	}
}
