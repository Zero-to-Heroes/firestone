import { Component, AfterViewInit, ElementRef, ViewEncapsulation, ChangeDetectionStrategy, ChangeDetectorRef, ViewRef } from '@angular/core';

import { NotificationsService, Notification } from 'angular2-notifications';
import { DebugService } from '../services/debug.service';

declare var overwolf: any;

@Component({
	selector: 'notifications',
	styleUrls: [
		'../../css/global/components-global.scss',
		'../../css/component/notifications/notifications.component.scss',
		'../../css/component/notifications/notifications-achievements.scss',
	],
	encapsulation: ViewEncapsulation.None,
	template: `
		<div class="notifications">
			<simple-notifications 
				[options]="toastOptions" 
				(onCreate)="created($event)" 
				(onDestroy)="destroyed($event)">
			</simple-notifications>
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
		// clickToClose: true,
		// clickToClose: false,
		maxStack: 5
	}

	private windowId: string;
	private mainWindowId: string;
	private activeNotifications: ActiveNotification[] = [];

	constructor(
		private notificationService: NotificationsService,
		private cdr: ChangeDetectorRef,
		private debugService: DebugService,
		private elRef: ElementRef) {

		overwolf.windows.onMessageReceived.addListener((message) => {
			// console.log('received message in notification window', message);
			let messageObject = JSON.parse(message.content);
			this.sendNotification(messageObject);
		})

		overwolf.windows.getCurrentWindow((result) => {
			this.windowId = result.window.id;
			// console.log('retrieved current notifications window', result, this.windowId);

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
	}

	ngAfterViewInit() {
		this.cdr.detach();
	}

	created(event) {
		// console.log('notif created', event, this.notificationService, this.activeNotifications);
		this.resize();
	}

	destroyed(event) {
		// console.log('notif destroyed', event, this.notificationService, this.activeNotifications);
		this.activeNotifications = this.activeNotifications
				.filter((notif) => notif.toast.id != event.id);
		this.resize();
	}

	private sendNotification(messageObject) {
		if (!this.windowId) {
			// console.log('Notification window isnt properly initialized yet, waiting');
			setTimeout(() => {
				this.sendNotification(messageObject);
			}, 100);
			return;
		}

		const activeNotif = this.activeNotifications.find((notif) => notif.cardId === messageObject.cardId);
		const notification = this.elRef.nativeElement.querySelector('.' + messageObject.cardId);
		if (messageObject.type === 'achievement-confirm' && notification && activeNotif) {
			this.confirmAchievement(messageObject.cardId, notification);
		}
		else {
			this.showNotification(messageObject);
		}
	}

	private confirmAchievement(cardId: string, notification) {
		console.log('in confirm achievement', cardId);
		const activeNotif = this.activeNotifications.find((notif) => notif.cardId === cardId);
		const toast = activeNotif.toast;
		console.log('active notif found', activeNotif, toast);
		toast.theClass = 'active';
		this.cdr.detectChanges();
		console.log('got notif', notification);
		notification.classList.add('active');
		console.log('updated notif', notification);
	}

	private showNotification(messageObject) {
		const htmlMessage: string = messageObject.content;
		const cardId: string = messageObject.cardId;
		const type: string = messageObject.type;
		const additionalTimeout: string = messageObject.timeout || 0;
		// console.log('received message, restoring notification window');
		overwolf.windows.restore(this.windowId, (result) => {
			// console.log('notifications window is on?', result);
			const override: any = {
				timeout: this.timeout + additionalTimeout,
				clickToClose: true 
			};
			if (type === 'achievement-pre-record') {
				override.clickToClose = false;
			}
			let toast = this.notificationService.html(htmlMessage, 'success', override);
			toast.theClass = messageObject.theClass;
			if (!(<ViewRef>this.cdr).destroyed) {
				this.cdr.detectChanges();
			}
			// console.log('running toast message in zone', toast);
			toast.click.subscribe((event: MouseEvent) => {
				console.log('registered click on toast', event, toast);
				if (!(<ViewRef>this.cdr).destroyed) {
					this.cdr.detectChanges();
				}
				// Clicked on close, don't show the card
				if (event.srcElement.className.indexOf("close") !== -1) {
					// Force close if it's not configured to auto close
					if (override.clickToClose === false) {
						this.notificationService.remove(toast.id);
					}
					// this.notificationService.remove(toast.id);
					return;
				}
				// Clicked on settings, don't show the card and don't close
				if (event.srcElement.className.indexOf("open-settings") !== -1) {
					event.preventDefault();
					event.stopPropagation();
					this.showSettings();
					return;
				}
				let currentElement = event.srcElement;
				while (!currentElement.classList.contains("unclickable") && currentElement.parentElement) {
					currentElement = currentElement.parentElement;
				}
				if (currentElement.classList.contains("unclickable")) {
					currentElement.classList.add("shake");
					setTimeout(() => {
						currentElement.classList.remove("shake");
					}, 500);
				}
				if (cardId) {
					const isAchievement = type === 'achievement-pre-record' || type === 'achievement-confirm';
					const isActiveAchievement = (type === 'achievement-pre-record' && toast.theClass === 'active')
							|| type === 'achievement-confirm';
					if (isActiveAchievement) {
						console.log('sending message', this.mainWindowId);
						overwolf.windows.sendMessage(this.mainWindowId, 'click-achievement', cardId, (result) => {
							console.log('send achievement click info to collection window', cardId, this.mainWindowId, result);
						});
						this.notificationService.remove(toast.id);
					}
					// Collection
					else if (!isAchievement) {
						overwolf.windows.sendMessage(this.mainWindowId, 'click-card', cardId, (result) => {
							console.log('send click info to collection window', cardId, this.mainWindowId, result);
						});
					}
				}
			});

			const activeNotif: ActiveNotification = {
				toast: toast,
				cardId: cardId,
				type: type
			};
			this.activeNotifications.push(activeNotif);
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
				if (!gameInfo) {
					return;
				}
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
	
	private showSettings() {
        console.log('showing settings');
        overwolf.windows.obtainDeclaredWindow("SettingsWindow", (result) => {
			if (result.status !== 'success') {
				console.warn('Could not get SettingsWindow', result);
				return;
			}
			overwolf.windows.restore(result.window.id, (result2) => { });
		});
	}
}

interface ActiveNotification {
	readonly toast: Notification;
	readonly cardId?: string;
	readonly type?: string;
}