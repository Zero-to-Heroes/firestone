import { Component, HostListener, Input, ChangeDetectionStrategy } from '@angular/core';

import { Set } from '../../models/set';

import { Events } from '../../services/events.service';
import { AllCardsService } from '../../services/all-cards.service';

declare var overwolf: any;

@Component({
	selector: 'collection-menu',
	styleUrls: [
		`../../../css/global/menu.scss`,
		`../../../css/component/collection/collection-menu.component.scss`,
	],
	template: `
		<ng-container [ngSwitch]="displayType">
			<ul *ngSwitchCase="'menu'" class="menu-selection-collection menu-selection">
				<li class="selected" (click)="goToCollectionView()">Sets</li>
				<!--<li>Cards</li>-->
			</ul>
			<ng-container *ngSwitchCase="'breadcrumbs'">
				<ul class="menu-selection-collection breadcrumbs" *ngIf="!searchString">
					<li (click)="goToCollectionView()" class="highlight-on-hover">Sets</li>
					<li class="separator">></li>
					<li (click)="goToFormatView()" class="highlight-on-hover">{{getSelectedFormat()}}</li>
					<li class="separator">></li>
					<li (click)="goToSetView()" class="highlight-on-hover" *ngIf="selectedSet">{{selectedSet.name}}</li>
					<li *ngIf="selectedCard" class="separator">></li>
					<li *ngIf="selectedCard" class="unclickable">{{selectedCard.name}}</li>
				</ul>
				<ul class="menu-selection-collection breadcrumbs" *ngIf="searchString">
					<li class="highlight-on-hover" (click)="goToCollectionView()">Home</li>
					<li class="separator">></li>
					<li class="unclickable">Search</li>
					<li class="separator">></li>
					<li class="unclickable">search result for {{searchString}}</li>
				</ul>
			</ng-container>
		</ng-container>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})

export class CollectionMenuComponent {

	@Input() public displayType: string;
	@Input() public selectedSet: Set;
	@Input() public selectedFormat: string;
	@Input() public searchString: string;

	selectedCard: any;

	constructor(private _events: Events, private cards: AllCardsService) {

	}

	@Input('selectedCardId') set selectedCardId(cardId: string) {
		this.selectedCard = this.cards.getCard(cardId);
	}

	getSelectedFormat() {
		return this.selectedFormat.charAt(0).toUpperCase() + this.selectedFormat.slice(1);
	}

	goToSetView() {
		this._events.broadcast(Events.SET_SELECTED, this.selectedSet);
	}

	goToFormatView() {
		this._events.broadcast(Events.FORMAT_SELECTED, this.selectedSet.standard ? 'standard' : 'wild');
	}

	goToCollectionView() {
		this._events.broadcast(Events.MODULE_SELECTED, 'collection');
	}
}
