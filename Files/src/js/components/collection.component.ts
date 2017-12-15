import { Component, ViewEncapsulation, HostListener, NgZone } from '@angular/core';

import * as Raven from 'raven-js';

import { CollectionManager } from '../services/collection-manager.service';
import { DebugService } from '../services/debug.service';

declare var overwolf: any;
declare var ga: any;

@Component({
	selector: 'collection',
	styleUrls: [`../../css/component/collection.component.scss`],
	encapsulation: ViewEncapsulation.None,
	template: `
		<div class="root">
			<div class="app-container">
				<div class="menu-bar">
					<i class="glyphicon glyphicon-resize-full" (click)="maximizeWindow()" *ngIf="!maximized"></i>
					<i class="glyphicon glyphicon-resize-small" (click)="restoreWindow()" *ngIf="maximized"></i>
					<i class="glyphicon glyphicon-remove" (click)="closeWindow()"></i>
				</div>
				<div class="content-container">
					<div class="content">
						<h1>
							<img class="logo" src="/IconStore.png" />
							<div class="title-text">
								<span class="title">HS Collection Companion</span>
								<span class="subtitle">Pack Opening & Collection Assistant</span>
							</div>
						</h1>
						<collection-stats class="main"></collection-stats>
					</div>
					<div id="ad-div"></div>
					<social-media></social-media>
					<version></version>
				</div>
			</div>
			<tooltips></tooltips>
		</div>
	`,
})
// 7.1.1.17994
export class CollectionComponent {

	private version;
	private maximized = false;
	private lastSize: any;

	constructor(
		private ngZone: NgZone,
		private debugService: DebugService,
		private collectionManager: CollectionManager) {

		console.log('constructor CollectionComponent');
		ga('send', 'event', 'collection', 'show');

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
