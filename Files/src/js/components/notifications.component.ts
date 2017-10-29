import { Component, NgZone, ElementRef, Renderer2, ViewChild, ViewEncapsulation } from '@angular/core';

import * as Raven from 'raven-js';
import { NotificationsService } from 'angular2-notifications';

declare var overwolf: any;

@Component({
	selector: 'notifications',
	styleUrls: [`../../css/component/notifications.component.scss`],
	encapsulation: ViewEncapsulation.None,
	template: `
		<div class="notifications">
			<simple-notifications [options]="toastOptions" (onCreate)="created($event)" (onDestroy)="destroyed($event)"></simple-notifications>
		</div>
	`,
})
// 7.1.1.17994
export class NotificationsComponent {

	// @ViewChild('notificationsContainer') container:ElementRef;

	private timeout = 10000;
	private windowId: string;
	// private closeTime: number;
	// private alreadyHiding: boolean;

	private toastOptions = {
		timeOut: this.timeout,
		pauseOnHover: true,
		showProgressBar: false,
	}

	constructor(
		private ngZone: NgZone,
		private notificationService: NotificationsService,
		private elRef: ElementRef) {

		overwolf.windows.onMessageReceived.addListener((message) => {
			console.log('received message in notification window', message);
			this.sendNotification(message.content);
		})

		overwolf.windows.getCurrentWindow((result) => {
			this.windowId = result.window.id;

			// Change position to be bottom right?
			console.log('retrieved current notifications window', result, this.windowId);
		})
		console.log('notifications windows initialized')
	}

	private sendNotification(htmlMessage: string) {
		overwolf.windows.restore(this.windowId, (result) => {
			console.log('notifications window is on?', result);

			this.ngZone.run(() => {
				let toast = this.notificationService.html(htmlMessage);
				console.log('toast', toast);
			});
			// this.closeTime = Date.now() + this.toastOptions.timeOut + 1000;
			// this.hideWindow();
		})
	}

	// private hideWindow() {
	// 	// Single instance... Could do that via specific class instead?
	// 	if (this.alreadyHiding) {
	// 		return;
	// 	}

	// 	this.alreadyHiding = true;
	// 	if (Date.now() < this.closeTime) {
	// 		setTimeout(this.hideWindow, (this.closeTime - Date.now()));
	// 		return;
	// 	}

	// 	overwolf.windows.minimize(this.windowId, (result) => {
	// 		console.log('hiding notifications', result);
	// 		this.alreadyHiding = false;
	// 	})
	// }

	private created(event) {
		console.log('created', event);
		this.resize();
	}

	private destroyed(event) {
		console.log('destroyed', event);
		this.resize();
	}

	private resize() {
		let wrapper = this.elRef.nativeElement.querySelector('.simple-notification-wrapper');
		overwolf.windows.getCurrentWindow((currentWindow) => {
			let height = wrapper.getBoundingClientRect().height + 20;
			let width = currentWindow.window.width;
			console.log('and current window', currentWindow);
			console.log('rect2', wrapper.getBoundingClientRect());
			overwolf.games.getRunningGameInfo((gameInfo) => {
				let gameWidth = gameInfo.width;
				let gameHeight = gameInfo.height;
				overwolf.windows.changeSize(currentWindow.window.id, width, height, (changeSize) => {
					console.log('changed window size', changeSize);
					overwolf.windows.changePosition(currentWindow.window.id, (gameWidth - width), (gameHeight - height), (changePosition) => {
						console.log('changed window position', changePosition);
						overwolf.windows.getCurrentWindow((tmp) => {
							console.log('new window', tmp);
						});
					});
				});
			});
		});
	}
}
