import { Component, NgZone, ElementRef, Renderer2, ViewChild, ViewEncapsulation } from '@angular/core';

import * as Raven from 'raven-js';

import { NotificationsService } from 'angular2-notifications';
import { DebugService } from '../services/debug.service';

declare var overwolf: any;

@Component({
	selector: 'notifications',
	styleUrls: [
		'../../css/global/components-global.scss',
		'../../css/component/notifications.component.scss',
	],
	encapsulation: ViewEncapsulation.None,
	template: `
		<div class="notifications">
			<simple-notifications [options]="toastOptions" (onCreate)="created($event)" (onDestroy)="destroyed($event)"></simple-notifications>
		</div>
	`,
})
export class NotificationsComponent {

	private timeout = 10000;
	private windowId: string;
	private mainWindowId: string;

	private toastOptions = {
		// timeOut: this.timeout,
		pauseOnHover: true,
		showProgressBar: false,
		clickToClose: false
	}

	constructor(
		private ngZone: NgZone,
		private notificationService: NotificationsService,
		private debugService: DebugService,
		private elRef: ElementRef) {

		overwolf.windows.onMessageReceived.addListener((message) => {
			console.log('received message in notification window', message);
			let messageObject = JSON.parse(message.content);
			this.sendNotification(messageObject.content, messageObject.cardId);
		})

		overwolf.windows.getCurrentWindow((result) => {
			this.windowId = result.window.id;

			// Change position to be bottom right?
			console.log('retrieved current notifications window', result, this.windowId);

			overwolf.windows.obtainDeclaredWindow("CollectionWindow", (result) => {
				if (result.status !== 'success') {
					console.warn('Could not get CollectionWindow', result);
				}
				this.mainWindowId = result.window.id;

				// overwolf.windows.sendMessage(this.mainWindowId, 'ack', 'ack', (result) => {
				// 	console.log('ack sent to main window', result);
				// });
			});
		})

		overwolf.games.onGameInfoUpdated.addListener((res: any) => {
			if (this.exitGame(res)) {
				this.closeApp();
			}
		});
		console.log('notifications windows initialized')
	}

	private sendNotification(htmlMessage: string, cardId?: string) {
		if (!this.windowId) {
			// console.log('Notification window isnt properly initialized yet, waiting');
			setTimeout(() => {
				this.sendNotification(htmlMessage);
			}, 100);
			return;
		}
		// console.log('received message, restoring notification window');
		overwolf.windows.restore(this.windowId, (result) => {
			// console.log('notifications window is on?', result);

			this.ngZone.run(() => {
				let toast = this.notificationService.html(htmlMessage);
				toast.click.subscribe((event) => {
					console.log('registered click on toast');
					if (cardId) {
						overwolf.windows.sendMessage(this.mainWindowId, 'click-card', cardId, (result) => {
							console.log('send click info to collection window', cardId, this.mainWindowId, result);
						});
					}
				})
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
			let height = wrapper.getBoundingClientRect().height + 20;
			let width = 500;
			console.log('and current window', currentWindow);
			console.log('rect2', wrapper.getBoundingClientRect());
			overwolf.games.getRunningGameInfo((gameInfo) => {
				let gameWidth = gameInfo.logicalWidth;
				let gameHeight = gameInfo.logicalHeight;
				let dpi = gameWidth / gameInfo.width;
				console.log('logical info', gameWidth, gameHeight, dpi);
				overwolf.windows.changeSize(currentWindow.window.id, width, height, (changeSize) => {
					console.log('changed window size', changeSize);
					let newLeft = ~~(gameWidth - width * dpi);
					let newTop = ~~(gameHeight - height * dpi);
					console.log('changing position', newLeft, newTop);
					// https://stackoverflow.com/questions/8388440/converting-a-double-to-an-int-in-javascript-without-rounding
					overwolf.windows.changePosition(currentWindow.window.id, newLeft, newTop, (changePosition) => {
						console.log('changed window position', changePosition);
						overwolf.windows.getCurrentWindow((tmp) => {
							console.log('new window', tmp);
						});
					});
				});
			});
		});
	}

	private exitGame(gameInfoResult: any): boolean {
		return (!gameInfoResult || !gameInfoResult.gameInfo || !gameInfoResult.gameInfo.isRunning);
	}

	private closeApp() {
		overwolf.windows.getCurrentWindow((result) => {
			if (result.status === "success") {
				console.log('closing');
				overwolf.windows.close(result.window.id);
			}
		});
	}
}
