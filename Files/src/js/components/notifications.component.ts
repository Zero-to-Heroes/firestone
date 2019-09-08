import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	EventEmitter,
	OnDestroy,
	ViewEncapsulation,
	ViewRef,
} from '@angular/core';
import { Notification, NotificationsService, NotificationType } from 'angular2-notifications';
import { Subscription } from 'rxjs';
import { DebugService } from '../services/debug.service';
import { ShowAchievementDetailsEvent } from '../services/mainwindow/store/events/achievements/show-achievement-details-event';
import { ShowCardDetailsEvent } from '../services/mainwindow/store/events/collection/show-card-details-event';
import { MainWindowStoreEvent } from '../services/mainwindow/store/events/main-window-store-event';
import { Message } from '../services/notifications.service';
import { OverwolfService } from '../services/overwolf.service';

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
			<simple-notifications [options]="toastOptions" (onCreate)="created($event)" (onDestroy)="destroyed($event)">
			</simple-notifications>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
// Maybe use https://www.npmjs.com/package/ngx-toastr instead
export class NotificationsComponent implements AfterViewInit, OnDestroy {
	timeout = 5000;
	// timeout = 999999999999;
	toastOptions = {
		timeOut: this.timeout,
		pauseOnHover: false,
		showProgressBar: false,
		maxStack: 5,
	};

	private windowId: string;
	private mainWindowId: string;
	private activeNotifications: ActiveNotification[] = [];
	private stateUpdater: EventEmitter<MainWindowStoreEvent>;
	private messageReceivedListener: (message: any) => void;
	private gameInfoListener: (message: any) => void;

	private pendingNotificationQueue: Message[] = [];
	private processingNotifs = false;

	constructor(
		private notificationService: NotificationsService,
		private cdr: ChangeDetectorRef,
		private debugService: DebugService,
		private ow: OverwolfService,
		private elRef: ElementRef,
	) {}

	async ngAfterViewInit() {
		this.cdr.detach();
		this.messageReceivedListener = this.ow.addMessageReceivedListener(message => {
			const messageObject: Message = JSON.parse(message.content);
			console.log('received message in notification window', messageObject.notificationId, messageObject.theClass);
			this.pendingNotificationQueue.push(messageObject);
		});
		this.gameInfoListener = this.ow.addGameInfoUpdatedListener(message => {
			console.log('state changed, resize?', message);
			if (message.resolutionChanged) {
				this.resize();
			}
		});
		this.windowId = (await this.ow.getCurrentWindow()).id;
		this.mainWindowId = (await this.ow.obtainDeclaredWindow('CollectionWindow')).id;
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;

		setInterval(async () => {
			if (this.processingNotifs) {
				return;
			}
			this.processingNotifs = true;
			let toProcess: Message;
			if (this.pendingNotificationQueue.length > 0) {
				toProcess = this.pendingNotificationQueue.shift();
				await this.sendNotification(toProcess);
			}
			this.processingNotifs = false;
		}, 50);
	}

	ngOnDestroy(): void {
		this.ow.removeGameInfoUpdatedListener(this.gameInfoListener);
		this.ow.removeMessageReceivedListener(this.messageReceivedListener);
	}

	created(event) {
		console.log('notif created', event.html, this.activeNotifications);
	}

	destroyed(event) {
		console.log('notif destroyed', event, this.activeNotifications);
		const deletedNotifications = this.activeNotifications.filter(notif => notif.toast.id === event.id);
		deletedNotifications.forEach(notif => notif.subscription.unsubscribe());
		this.activeNotifications = this.activeNotifications.filter(notif => notif.toast.id !== event.id);
	}

	private async sendNotification(messageObject: Message): Promise<void> {
		return new Promise<void>(async resolve => {
			await this.waitForInit();
			const activeNotif = this.activeNotifications.find(notif => notif.notificationId === messageObject.notificationId);
			const notification = this.elRef.nativeElement.querySelector('.' + messageObject.notificationId);
			if (notification && activeNotif) {
				await this.updateAchievementNotification(messageObject.notificationId, messageObject.theClass, notification);
			} else {
				await this.showNotification(messageObject);
			}
			resolve();
		});
	}

	private async updateAchievementNotification(notificationId: string, newClass: string, notification) {
		console.log('in confirm achievement', notificationId);
		const activeNotif = this.activeNotifications.find(notif => notif.notificationId === notificationId);
		const toast = activeNotif.toast;
		console.log('active notif found', notificationId, activeNotif.notificationId);
		toast.theClass = newClass;
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
		notification.classList.add(newClass);
		console.log('updated notif', notification);
	}

	private async showNotification(messageObject: Message) {
		return new Promise<void>(async resolve => {
			console.log('showing notification', messageObject.notificationId);
			const htmlMessage: string = messageObject.content;
			const cardId: string = messageObject.cardId;
			const type: string = messageObject.type;
			const additionalTimeout: number = messageObject.timeout || 0;
			await this.ow.restoreWindow(this.windowId);
			const override: any = {
				timeOut: this.timeout + additionalTimeout,
				clickToClose: true,
			};
			if (type === 'achievement-pre-record') {
				override.clickToClose = false;
			}
			const toast = this.notificationService.html(htmlMessage, NotificationType.Success, override);
			toast.theClass = messageObject.theClass;
			console.log('created toast', toast.id, messageObject.notificationId);
			if (!(this.cdr as ViewRef).destroyed) {
				this.cdr.detectChanges();
			}
			// console.log('running toast message in zone', toast);
			const subscription: Subscription = toast.click.subscribe((event: MouseEvent) => {
				console.log('registered click on toast', event, toast);
				if (!(this.cdr as ViewRef).destroyed) {
					this.cdr.detectChanges();
				}
				let currentElement: any = event.srcElement;
				// Clicked on close, don't show the card
				if (currentElement.className.indexOf('close') !== -1) {
					// Force close if it's not configured to auto close
					if (override.clickToClose === false) {
						this.notificationService.remove(toast.id);
					}
					// this.notificationService.remove(toast.id);
					return;
				}
				// Clicked on settings, don't show the card and don't close
				if (currentElement.className.indexOf('open-settings') !== -1) {
					event.preventDefault();
					event.stopPropagation();
					this.showSettings();
					return;
				}
				while (!currentElement.classList.contains('unclickable') && currentElement.parentElement) {
					currentElement = currentElement.parentElement;
				}
				if (currentElement.classList.contains('unclickable')) {
					currentElement.classList.add('shake');
					setTimeout(() => {
						currentElement.classList.remove('shake');
					}, 500);
					return;
				}
				if (cardId) {
					const isAchievement = messageObject.app === 'achievement';
					if (isAchievement) {
						console.log('sending message', this.mainWindowId);
						this.stateUpdater.next(new ShowAchievementDetailsEvent(cardId));
						this.notificationService.remove(toast.id);
					} else {
						this.stateUpdater.next(new ShowCardDetailsEvent(cardId));
					}
				}
			});

			const activeNotif: ActiveNotification = {
				toast: toast,
				subscription: subscription,
				notificationId: messageObject.notificationId,
				type: type,
			};
			this.activeNotifications.push(activeNotif);
			resolve();

			setTimeout(() => {
				const notification = this.elRef.nativeElement.querySelector('.' + messageObject.notificationId);
				if (notification) {
					notification.classList.add(messageObject.theClass);
				}
			}, 200);
		});
	}

	private resize() {
		setTimeout(async () => {
			const wrapper = this.elRef.nativeElement.querySelector('.simple-notification-wrapper');
			const width = 500;
			const gameInfo = await this.ow.getRunningGameInfo();
			console.log('game info', gameInfo, wrapper, wrapper.getBoundingClientRect(), this.activeNotifications.length);
			if (!gameInfo) {
				return;
			}
			const gameWidth = gameInfo.logicalWidth;
			const gameHeight = gameInfo.logicalHeight;
			const dpi = gameWidth / gameInfo.width;
			await this.ow.changeWindowSize(this.windowId, width, gameHeight - 1);
			// https://stackoverflow.com/questions/8388440/converting-a-double-to-an-int-in-javascript-without-rounding
			const newLeft = ~~(gameWidth - width * dpi);
			const newTop = 1;
			await this.ow.changeWindowPosition(this.windowId, newLeft, newTop);
		});
	}

	private async showSettings() {
		console.log('showing settings');
		const window = await this.ow.obtainDeclaredWindow('SettingsWindow');
		await this.ow.restoreWindow(window.id);
	}

	private waitForInit(): Promise<void> {
		return new Promise<void>(resolve => {
			const theWait = () => {
				// console.log('Promise waiting for db');
				if (this.windowId) {
					// console.log('wait for db init complete');
					resolve();
				} else {
					// console.log('waiting for db init');
					setTimeout(() => theWait(), 50);
				}
			};
			theWait();
		});
	}
}

interface ActiveNotification {
	readonly toast: Notification;
	readonly subscription: Subscription;
	readonly notificationId: string;
	readonly type?: string;
}
