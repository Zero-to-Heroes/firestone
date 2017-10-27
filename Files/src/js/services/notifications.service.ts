import { Injectable } from '@angular/core';

import * as Raven from 'raven-js';

declare var OverwolfPlugin: any;
declare var overwolf: any;

@Injectable()
export class OwNotificationsService {

	private windowId: string;
	private messageId: number;

	constructor() {
		this.detectNotificationsWindow();
	}

	public html(htmlMessage: string) {
		console.log('trying to display html message: ', htmlMessage);
		if (!this.windowId) {
			throw new Error("NotificationsWindow was not identified at app start");
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
	}
}
