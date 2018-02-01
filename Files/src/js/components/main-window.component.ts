import { Component, ViewEncapsulation, HostListener, NgZone } from '@angular/core';

import * as Raven from 'raven-js';

import { CollectionManager } from '../services/collection-manager.service';
import { DebugService } from '../services/debug.service';
import { Events } from '../services/events.service';

declare var overwolf: any;
declare var ga: any;

@Component({
	selector: 'main-window',
	styleUrls: [`../../css/component/main-window.component.scss`],
	encapsulation: ViewEncapsulation.None,
	template: `
		<div class="root">
			<div class="app-container">
				<section class="menu-bar">
					<real-time-notifications></real-time-notifications>
					<div class="controls">
						<i class="glyphicon glyphicon-home" (click)="goHome()"></i>
						<i class="glyphicon glyphicon-settings" (click)="showSettings()"></i>
						<i class="glyphicon glyphicon-help" (click)="showHelp()"></i>
						<i class="glyphicon glyphicon-resize-full" (click)="maximizeWindow()" *ngIf="!maximized"></i>
						<i class="glyphicon glyphicon-resize-small" (click)="restoreWindow()" *ngIf="maximized"></i>
						<i class="glyphicon glyphicon-remove" (click)="closeWindow()"></i>
					</div>
				</section>
				<section class="content-container">
					<div class="navigation">
						<img class="logo" src="/IconStore.png" />
						<menu-selection></menu-selection>
						<hearthhead></hearthhead>
					</div>
					<ng-container [ngSwitch]="selectedModule">
						<collection *ngSwitchCase="'collection'" class="main-section"></collection>
					</ng-container>
				</section>
			</div>
			<tooltips></tooltips>
			<login *ngIf="showLogin" (close)="showLogin = false"></login>
		</div>
	`,
})
// 7.1.1.17994
export class MainWindowComponent {

	private version;
	private maximized = false;
	private lastSize: any;

	private showLogin = false;

	private selectedModule = 'collection';

	constructor(
		private ngZone: NgZone,
		private debugService: DebugService,
		private events: Events,
		private collectionManager: CollectionManager) {

		ga('send', 'event', 'collection', 'show');

		this.events.on(Events.HEARTHHEAD_LOGIN).subscribe(
			(data) => {
				this.showLogin = true;
			}
		)

		this.events.on(Events.MODULE_SELECTED).subscribe(
			(data) => {
				this.selectedModule = data.data[0];
				console.log('selected module', this.selectedModule);
			}
		)

	}

	@HostListener('mousedown', ['$event'])
	private dragMove(event: MouseEvent) {
		overwolf.windows.getCurrentWindow((result) => {
			if (result.status === "success"){
				overwolf.windows.dragMove(result.window.id);
			}
		});
	};

	private closeWindow() {
		overwolf.windows.getCurrentWindow((result) => {
			if (result.status === "success"){
				overwolf.windows.close(result.window.id);
			}
		});
	};

	private maximizeWindow() {
		overwolf.windows.getCurrentWindow((result) => {
			if (result.status === "success") {
				this.lastSize = {
					width: result.window.width,
					height: result.window.height,
					top: result.window.top,
					left: result.window.left
				}
				overwolf.windows.maximize(result.window.id, (result) => {
					console.log('window maximized', result);
					this.ngZone.run(() => {
						this.maximized = true;
					});
				});
			}
		});
	}

	private restoreWindow() {
		overwolf.windows.getCurrentWindow((result) => {
			if (result.status === "success") {
				let windowId = result.window.id;
				overwolf.windows.changeSize(windowId, this.lastSize.width, this.lastSize.height, (result) => {
					console.log('window resize', result);
					overwolf.windows.changePosition(windowId, this.lastSize.left, this.lastSize.top, (result) => {
						console.log('window repositioned', result);
						this.ngZone.run(() => {
							this.maximized = false;
						});
					});
				});
			}
		});
	}
}
