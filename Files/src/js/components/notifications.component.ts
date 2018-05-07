import { Component, NgZone, ElementRef, Renderer2, ViewChild, ViewEncapsulation } from '@angular/core';

import * as Raven from 'raven-js';

import { NotificationsService } from 'angular2-notifications';
import { DebugService } from '../services/debug.service';

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
export class NotificationsComponent {

	private timeout = 20000;
	private windowId: string;
	// private mainWindowId: string;

	private toastOptions = {
		timeOut: this.timeout,
		pauseOnHover: true,
		showProgressBar: false,
	}

	constructor(
		private ngZone: NgZone,
		private notificationService: NotificationsService,
		private debugService: DebugService,
		private elRef: ElementRef) {

		overwolf.windows.onMessageReceived.addListener((message) => {
			console.log('received message in notification window', message);
			this.sendNotification(message.content);
		})

		overwolf.windows.getCurrentWindow((result) => {
			this.windowId = result.window.id;

			// Change position to be bottom right?
			console.log('retrieved current notifications window', result, this.windowId);

			// overwolf.windows.obtainDeclaredWindow("MainWindow", (result) => {
			// 	if (result.status !== 'success') {
			// 		console.warn('Could not get MainWindow', result);
			// 	}
			// 	this.mainWindowId = result.window.id;


			// 	overwolf.windows.sendMessage(this.mainWindowId, 'ack', 'ack', (result) => {
			// 		console.log('ack sent to main window', result);
			// 	});
			// });
		})
		console.log('notifications windows initialized')
	}

	private sendNotification(htmlMessage: string) {
		if (!this.windowId) {
			console.log('Notification window isnt properly initialized yet, waiting');
			setTimeout(() => {
				this.sendNotification(htmlMessage);
			}, 100);
			return;
		}
		console.log('received message, restoring notification window');
		overwolf.windows.restore(this.windowId, (result) => {
			console.log('notifications window is on?', result);

			this.ngZone.run(() => {
				let toast = this.notificationService.html(htmlMessage);
				console.log('toast', toast);
			});
		})
	}

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
			let height = parseInt(wrapper.getBoundingClientRect().height + 20, 10);
			let width = parseInt(currentWindow.window.width, 10);
			console.log('and current window', currentWindow);
			console.log('rect2', wrapper.getBoundingClientRect());
			overwolf.games.getRunningGameInfo((gameInfo) => {
				let gameWidth = parseInt(gameInfo.width, 10);
				let gameHeight = parseInt(gameInfo.height, 10);
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
