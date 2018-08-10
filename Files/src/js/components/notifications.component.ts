import { Component, AfterViewInit, ElementRef, ViewEncapsulation, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';

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
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsComponent implements AfterViewInit {

	timeout = 20000;
	// timeout = 999999999999;
	toastOptions = {
		timeOut: this.timeout,
		pauseOnHover: false,
		showProgressBar: false,
		clickToClose: true,
		maxStack: 5
	}

	private windowId: string;
	private mainWindowId: string;

	constructor(
		private notificationService: NotificationsService,
		private cdr: ChangeDetectorRef,
		private debugService: DebugService,
		private elRef: ElementRef) {

		overwolf.windows.onMessageReceived.addListener((message) => {
			// console.log('received message in notification window', message);
			let messageObject = JSON.parse(message.content);
			this.sendNotification(messageObject.content, messageObject.cardId);
		})

		overwolf.windows.getCurrentWindow((result) => {
			this.windowId = result.window.id;
			console.log('retrieved current notifications window', result, this.windowId);

			overwolf.windows.obtainDeclaredWindow("CollectionWindow", (result) => {
				if (result.status !== 'success') {
					console.warn('Could not get CollectionWindow', result);
				}
				this.mainWindowId = result.window.id;
			});
		})

		overwolf.games.onGameInfoUpdated.addListener((res: any) => {
			if (this.exitGame(res)) {
				this.closeApp();
			}
		});
		console.log('notifications windows initialized')
	}

	ngAfterViewInit() {
		this.cdr.detach();
	}

	created(event) {
		this.resize();
	}

	destroyed(event) {
		this.resize();
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
			let toast = this.notificationService.html(htmlMessage);
			this.cdr.detectChanges();
			// console.log('running toast message in zone', toast);
			toast.click.subscribe((event: MouseEvent) => {
				console.log('registered click on toast', event, toast);
				this.cdr.detectChanges();
				// Clicked on close, don't show the card
				if (event.srcElement.className.indexOf("close") != -1) {
					// this.notificationService.remove(toast.id);
					return;
				}
				if (cardId) {
					overwolf.windows.sendMessage(this.mainWindowId, 'click-card', cardId, (result) => {
						console.log('send click info to collection window', cardId, this.mainWindowId, result);
					});
				}
			});
		})
	}

	private resize() {
		setTimeout(() => {
			let wrapper = this.elRef.nativeElement.querySelector('.simple-notification-wrapper');
			let height = wrapper.getBoundingClientRect().height + 20;
			let width = 500;
			// console.log('resizing, current window');
			// console.log('rect2', wrapper.getBoundingClientRect());
			overwolf.games.getRunningGameInfo((gameInfo) => {
				let gameWidth = gameInfo.logicalWidth;
				let gameHeight = gameInfo.logicalHeight;
				let dpi = gameWidth / gameInfo.width;
				// console.log('logical info', gameWidth, gameHeight, dpi);
				overwolf.windows.changeSize(this.windowId, width, height, (changeSize) => {
					// console.log('changed window size');
					// https://stackoverflow.com/questions/8388440/converting-a-double-to-an-int-in-javascript-without-rounding
					let newLeft = ~~(gameWidth - width * dpi);
					let newTop = ~~(gameHeight - height * dpi - 10);
					// console.log('changing position', newLeft, newTop, width, height);
					overwolf.windows.changePosition(this.windowId, newLeft, newTop, (changePosition) => {
						// console.log('changed window position');
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
