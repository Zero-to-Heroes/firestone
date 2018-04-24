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
	// private notificationWindowInit = false;

	constructor() {
		this.detectNotificationsWindow();
	}

	public html(htmlMessage: Message) {
		console.log('trying to display html message: ', htmlMessage);
		if (!this.windowId) {
			if (this.retriesLeft <= 0) {
				throw new Error("NotificationsWindow was not identified at app start");
			}
			else {
				this.retriesLeft--;
				setTimeout(() => {
					this.html(htmlMessage);
				}, 500);
				return;
			}
		}

		// overwolf.windows.restore(this.windowId, (result) => {
		// 		console.log('notifications window is on?', result);
		// 	})
		let strMessage = JSON.stringify(htmlMessage);
		overwolf.windows.sendMessage(this.windowId, '' + this.messageId++, strMessage, (result) => {
			console.log('Notification service sent message to notifications window', result);
		});
	}

	private detectNotificationsWindow() {
		console.log('initializing notifications service');

		// overwolf.windows.onMessageReceived.addListener((message) => {
		// 	console.log('received notifications ack', message);
		// 	if (message.content === 'ack') {
		// 		this.notificationWindowInit = true;
		// 	}
		// })

		overwolf.windows.obtainDeclaredWindow("NotificationsWindow", (result) => {
			if (result.status !== 'success') {
				console.warn('Could not get NotificationsWindow', result);
			}
			console.log('got notifications window', result);
			let windowId = result.window.id;

			overwolf.windows.restore(windowId, (result) => {
				console.log('notifications window is on?', result);
				overwolf.windows.minimize(windowId, (result) => {
					this.windowId = windowId;
					console.log('notification window is minimized at start, now listening to notifications', result);
				})
			})
		});
	}
}

export interface Message {
	content: string,
	cardId?: number
}
