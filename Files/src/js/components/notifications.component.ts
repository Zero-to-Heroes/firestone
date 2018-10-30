import { Component, AfterViewInit, ElementRef, ViewEncapsulation, ChangeDetectionStrategy, ChangeDetectorRef, ViewRef } from '@angular/core';

import { NotificationsService, Notification } from 'angular2-notifications';
import { DebugService } from '../services/debug.service';
import { NG_MODEL_WITH_FORM_CONTROL_WARNING } from '@angular/forms/src/directives';
import { not } from 'rxjs/internal/util/not';

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
			this.sendNotification(messageObject.content, messageObject.cardId, messageObject.type);
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

	private sendNotification(htmlMessage: string, cardId?: string, type?: string) {
		if (!this.windowId) {
			// console.log('Notification window isnt properly initialized yet, waiting');
			setTimeout(() => {
				this.sendNotification(htmlMessage);
			}, 100);
			return;
		}

		if (type === 'achievement-confirm') {
			this.confirmAchievement(cardId);
		}
		else {
			this.showNotification(htmlMessage, cardId, type);
		}
	}

	private confirmAchievement(cardId: string) {
		console.log('in confirml achievement', cardId);
		const activeNotif = this.activeNotifications.find((notif) => notif.cardId === cardId);
		if (activeNotif != null) {
			const toast = activeNotif.toast;
			toast.theClass = 'active';
			console.log('active notif found', activeNotif, toast);
			this.cdr.detectChanges();
		}
		const notification = this.elRef.nativeElement.querySelector('.' + cardId);
		console.log('got notif', notification);
		notification.classList.add('active');
		console.log('updated notif', notification);
	}

	private showNotification(htmlMessage: string, cardId?: string, type?: string) {
		// console.log('received message, restoring notification window');
		overwolf.windows.restore(this.windowId, (result) => {
			// console.log('notifications window is on?', result);
			const override: any = { clickToClose: true };
			if (type === 'achievement-pre-record') {
				override.clickToClose = false;
			}
			let toast = this.notificationService.html(htmlMessage, 'success', override);
			if (!(<ViewRef>this.cdr).destroyed) {
				this.cdr.detectChanges();
			}
			// console.log('running toast message in zone', toast);
			toast.click.subscribe((event: MouseEvent) => {
				console.log('registered click on toast', event, toast, toast.theClass);
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
				if (cardId) {
					if (type === 'achievement-pre-record') {
						if (toast.theClass === 'active') {
							console.log('sending message', this.mainWindowId);
							overwolf.windows.sendMessage(this.mainWindowId, 'click-achievement', cardId, (result) => {
								console.log('send achievement click info to collection window', cardId, this.mainWindowId, result);
							});
							this.notificationService.remove(toast.id);
						}
						// Otherwise do nothing
					}
					// Collection
					else {
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
}

interface ActiveNotification {
	readonly toast: Notification;
	readonly cardId?: string;
	readonly type?: string;
}