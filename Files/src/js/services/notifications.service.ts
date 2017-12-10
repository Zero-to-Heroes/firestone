import { Injectable } from '@angular/core';

import * as Raven from 'raven-js';

declare var OverwolfPlugin: any;
declare var overwolf: any;
declare var ga: any;

@Injectable()
export class OwNotificationsService {

	private windowId: string;
	private messageId: number;

	private retriesLeft = 10;
	private notificationWindowInit = false;

	constructor() {
		this.detectNotificationsWindow();
	}

	public html(htmlMessage: string) {
		console.log('trying to display html message: ', htmlMessage);
		if (!this.windowId || !this.notificationWindowInit) {
			if (this.retriesLeft <= 0) {
				throw new Error("NotificationsWindow was not identified at app start");
			}
			else {
				this.retriesLeft--;
				setTimeout(() => {
					this.html(htmlMessage);
				}, 100);
				return;
			}
		}

		// overwolf.windows.restore(this.windowId, (result) => {
		// 		console.log('notifications window is on?', result);
		// 	})
		overwolf.windows.sendMessage(this.windowId, '' + this.messageId++, htmlMessage, (result) => {
			console.log('sent message to notifications window', result);
		});
	}

	private detectNotificationsWindow() {
		console.log('initializing notifications service');
		overwolf.windows.obtainDeclaredWindow("NotificationsWindow", (result) => {
			if (result.status !== 'success') {
				console.warn('Could not get NotificationsWindow', result);
			}
			console.log('got notifications window', result);
			this.windowId = result.window.id;

			overwolf.windows.restore(this.windowId, (result) => {
				console.log('notifications window is on?', result);
				overwolf.windows.minimize(this.windowId, (result) => {
					console.log('minimized at start', result);
				})
			})
		});

		overwolf.windows.onMessageReceived.addListener((message) => {
			console.log('received ack', message);
			if (message.content === 'ack') {
				this.notificationWindowInit = true;
			}
		})
	}
}
