import { Component, Input, ChangeDetectionStrategy, AfterViewInit, EventEmitter } from '@angular/core';

import { Set } from '../../models/set';

import { Events } from '../../services/events.service';
import { AllCardsService } from '../../services/all-cards.service';
import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';
import { ChangeVisibleApplicationEvent } from '../../services/mainwindow/store/events/change-visible-application-event';
import { SelectCollectionFormatEvent } from '../../services/mainwindow/store/events/collection/select-collection-format-event';
import { SelectCollectionSetEvent } from '../../services/mainwindow/store/events/collection/select-collection-set-event';
import { OverwolfService } from '../../services/overwolf.service';

@Component({
	selector: 'collection-menu',
	styleUrls: [`../../../css/global/menu.scss`, `../../../css/component/collection/collection-menu.component.scss`],
	template: `
		<ng-container [ngSwitch]="_displayType">
			<ul *ngSwitchCase="'menu'" class="menu-selection-collection menu-selection">
				<li class="selected" (mousedown)="goToCollectionView()">Sets</li>
			</ul>
			<ng-container *ngSwitchCase="'breadcrumbs'">
				<ul class="menu-selection-collection breadcrumbs" *ngIf="!searchString">
					<li (mousedown)="goToCollectionView()" class="highlight-on-hover">Sets</li>
					<li class="separator">></li>
					<li (mousedown)="goToFormatView()" class="highlight-on-hover">{{ getSelectedFormat() }}</li>
					<li class="separator">></li>
					<li (mousedown)="goToSetView()" class="highlight-on-hover" *ngIf="selectedSet">
						{{ selectedSet.name }}
					</li>
					<li *ngIf="selectedCard" class="separator">></li>
					<li *ngIf="selectedCard" class="unclickable">{{ selectedCard.name }}</li>
				</ul>
				<ul class="menu-selection-collection breadcrumbs" *ngIf="searchString">
					<li class="highlight-on-hover" (mousedown)="goToCollectionView()">Home</li>
					<li class="separator">></li>
					<li class="unclickable">Search</li>
					<li class="separator">></li>
					<li class="unclickable">search result for {{ searchString }}</li>
				</ul>
			</ng-container>
		</ng-container>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionMenuComponent implements AfterViewInit {
	_displayType: string;
	@Input() public selectedSet: Set;
	@Input() public selectedFormat: string;
	@Input() public searchString: string;
	selectedCard: any;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private _events: Events, private cards: AllCardsService, private ow: OverwolfService) {}

	@Input() set displayType(displayType: string) {
		console.log('setting display type', displayType);
		this._displayType = displayType;
	}

	@Input('selectedCardId') set selectedCardId(cardId: string) {
		this.selectedCard = cardId ? this.cards.getCard(cardId) : undefined;
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	getSelectedFormat() {
		return this.selectedFormat.charAt(0).toUpperCase() + this.selectedFormat.slice(1);
	}

	goToSetView() {
		this._events.broadcast(Events.HIDE_TOOLTIP);
		this.stateUpdater.next(new SelectCollectionSetEvent(this.selectedSet.id));
	}

	goToFormatView() {
		this._events.broadcast(Events.HIDE_TOOLTIP);
		this.stateUpdater.next(new SelectCollectionFormatEvent(this.selectedSet.standard ? 'standard' : 'wild'));
	}

	goToCollectionView() {
		this._events.broadcast(Events.HIDE_TOOLTIP);
		this.stateUpdater.next(new ChangeVisibleApplicationEvent('collection'));
	}
}
