import { Injectable } from '@angular/core';

import { OwNotificationsService } from '../services/notifications.service';
import { Events } from '../services/events.service';

import * as Raven from 'raven-js';

declare var OverwolfPlugin: any;
declare var overwolf: any;

@Injectable()
export class LogStatusService {

	private windowId: string;

	private loaded = false;
	private retriesLeft = 10;
	private errorsWindowInit = false;

	constructor() {

		// console.log('initializing log-status service');
		// this.detectErrorsWindow();

		// this.events.on(Events.START_LOG_FILE_DETECTION)
		// 	.subscribe(event => {
		// 		setTimeout(() => {
		// 			if (!this.loaded) {
		// 				this.createDetectingLogsToast(event.data[0]);
		// 			}
		// 		}, 1500);
		// 	});
		// this.events.on(Events.STREAMING_LOG_FILE)
		// 	.subscribe(event => {
		// 		this.createAppRunningToast(event.data[0]);
		// 	});
		// this.events.on(Events.NO_LOG_FILE)
		// 	.subscribe(event => {
		// 		this.error('no_log_file', event.data[0]);
		// 	});
	}

	// private createDetectingLogsToast(logFile: string) {
	// 	console.log('sending log detection start notification');
	// 	this.notificationService.html({ content: `<div class="message-container-app"><img src="/IconStore.png"><div class="message">Lorekeeper is detecting your ${logFile} log file. It shouldn\'t take more than 15s</div></div>` });
	// }

	// private createAppRunningToast(monitoredObject: string) {
	// 	console.log('sending start notification');
	// 	this.loaded = true;
	// 	this.notificationService.html({ content: `<div class="message-container-app"><img src="/IconStore.png"><div class="message">Lorekeeper is now monitoring your ${monitoredObject} file. Press Ctrl + C to bring the main window</div></div>` });
	// }

	// public error(messageId: string, message: string) {
	// 	console.log('trying to display error: ', message);
	// 	if (!this.windowId || !this.errorsWindowInit) {
	// 		if (this.retriesLeft <= 0) {
	// 			throw new Error("ErrorsWindow was not identified at app start");
	// 		}
	// 		else {
	// 			this.retriesLeft--;
	// 			setTimeout(() => {
	// 				this.error(messageId, message);
	// 			}, 100);
	// 			return;
	// 		}
	// 	}

	// 	overwolf.windows.sendMessage(this.windowId, messageId, message, (result) => {
	// 		console.log('sent message to error window', result);
	// 	});
	// }

	// private detectErrorsWindow() {
	// 	overwolf.windows.obtainDeclaredWindow("ErrorsWindow", (result) => {
	// 		if (result.status !== 'success') {
	// 			console.warn('Could not get ErrorsWindow', result);
	// 		}
	// 		console.log('got ErrorsWindow', result);
	// 		this.windowId = result.window.id;

	// 		overwolf.windows.restore(this.windowId, (result) => {
	// 			console.log('ErrorsWindoww is on?', result);
	// 			overwolf.windows.hide(this.windowId, (result) => {
	// 				console.log('minimized at start', result);
	// 			})
	// 		})
	// 	});

	// 	overwolf.windows.onMessageReceived.addListener((message) => {
	// 		if (message.content === 'ack_errors') {
	// 			console.log('received ack_error', message);
	// 			this.errorsWindowInit = true;
	// 		}
	// 	})
	// }
}
