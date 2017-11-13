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

	constructor(
		private events: Events,
		private notificationService: OwNotificationsService) {

		console.log('initializing log-status service');
		this.detectErrorsWindow();

		this.events.on(Events.START_LOG_FILE_DETECTION)
			.subscribe(event => {
				setTimeout(() => {
					if (!this.loaded) {
						this.createDetectingLogsToast();
					}
				}, 1500);
			});
		this.events.on(Events.STREAMING_LOG_FILE)
			.subscribe(event => {
				this.createAppRunningToast();
			});
		this.events.on(Events.NO_LOG_FILE)
			.subscribe(event => {
				this.error('no_log_file', 'no_log_file');
			});
	}

	private createDetectingLogsToast() {
		console.log('sending log detection start notification');
		this.notificationService.html('<div class="message-container"><img src="/IconStore.png"><div class="message">HS Collection Companion is detecting your log files. It shouldn\'t take more than 15s</div></div>');
	}

	private createAppRunningToast() {
		console.log('sending start notification');
		this.loaded = true;
		this.notificationService.html('<div class="message-container"><img src="/IconStore.png"><div class="message">HS Collection Companion is now monitoring your card packs.</div></div>');
	}

	public error(messageId: string, message: string) {
		console.log('trying to display error: ', message);
		if (!this.windowId || !this.errorsWindowInit) {
			if (this.retriesLeft <= 0) {
				throw new Error("ErrorsWindow was not identified at app start");
			}
			else {
				this.retriesLeft--;
				setTimeout(() => {
					this.error(messageId, message);
				}, 100);
				return;
			}
		}

		overwolf.windows.sendMessage(this.windowId, messageId, message, (result) => {
			console.log('sent message to notifications window', result);
		});
	}

	private detectErrorsWindow() {
		overwolf.windows.obtainDeclaredWindow("ErrorsWindow", (result) => {
			if (result.status !== 'success') {
				console.warn('Could not get ErrorsWindow', result);
			}
			console.log('got ErrorsWindow', result);
			this.windowId = result.window.id;

			overwolf.windows.restore(this.windowId, (result) => {
				console.log('ErrorsWindoww is on?', result);
				overwolf.windows.minimize(this.windowId, (result) => {
					console.log('minimized at start', result);
				})
			})
		});

		overwolf.windows.onMessageReceived.addListener((message) => {
			console.log('received ack_error', message);
			if (message.content === 'ack_errors') {
				this.errorsWindowInit = true;
			}
		})
	}
}
