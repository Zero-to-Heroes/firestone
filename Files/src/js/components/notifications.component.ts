import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	EventEmitter,
	ViewEncapsulation,
	ViewRef,
} from '@angular/core';
import { Notification, NotificationsService, NotificationType } from 'angular2-notifications';
import { DebugService } from '../services/debug.service';
import { ShowAchievementDetailsEvent } from '../services/mainwindow/store/events/achievements/show-achievement-details-event';
import { ShowCardDetailsEvent } from '../services/mainwindow/store/events/collection/show-card-details-event';
import { MainWindowStoreEvent } from '../services/mainwindow/store/events/main-window-store-event';
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
export class NotificationsComponent implements AfterViewInit {
	timeout = 20000;
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

	constructor(
		private notificationService: NotificationsService,
		private cdr: ChangeDetectorRef,
		private debugService: DebugService,
		private ow: OverwolfService,
		private elRef: ElementRef,
	) {}

	async ngAfterViewInit() {
		this.cdr.detach();
		this.ow.addMessageReceivedListener(message => {
			console.log('received message in notification window', message);
			const messageObject = JSON.parse(message.content);
			this.sendNotification(messageObject);
		});
		this.windowId = (await this.ow.getCurrentWindow()).id;
		this.mainWindowId = (await this.ow.obtainDeclaredWindow('CollectionWindow')).id;
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	created(event) {
		console.log('notif created', event, this.notificationService, this.activeNotifications);
		this.resize();
	}

	destroyed(event) {
		console.log('notif destroyed', event, this.notificationService, this.activeNotifications);
		this.activeNotifications = this.activeNotifications.filter(notif => notif.toast.id !== event.id);
		this.resize();
	}

	private sendNotification(messageObject) {
		if (!this.windowId) {
			setTimeout(() => {
				this.sendNotification(messageObject);
			}, 100);
			return;
		}
		const activeNotif = this.activeNotifications.find(notif => notif.cardId === messageObject.cardId);
		const notification = this.elRef.nativeElement.querySelector('.' + messageObject.cardId);
		if (messageObject.type === 'achievement-confirm' && notification && activeNotif) {
			this.confirmAchievement(messageObject.cardId, notification);
		} else {
			this.showNotification(messageObject);
		}
	}

	private confirmAchievement(cardId: string, notification) {
		console.log('in confirm achievement', cardId);
		const activeNotif = this.activeNotifications.find(notif => notif.cardId === cardId);
		const toast = activeNotif.toast;
		console.log('active notif found', activeNotif, toast);
		toast.theClass = 'active';
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
		console.log('got notif', notification);
		notification.classList.add('active');
		console.log('updated notif', notification);
	}

	private async showNotification(messageObject) {
		console.log('showing notification', messageObject);
		const htmlMessage: string = messageObject.content;
		const cardId: string = messageObject.cardId;
		const type: string = messageObject.type;
		const additionalTimeout: string = messageObject.timeout || 0;
		await this.ow.restoreWindow(this.windowId);
		const override: any = {
			timeout: this.timeout + additionalTimeout,
			clickToClose: true,
		};
		if (type === 'achievement-pre-record') {
			override.clickToClose = false;
		}
		const toast = this.notificationService.html(htmlMessage, NotificationType.Success, override);
		toast.theClass = messageObject.theClass;
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
		// console.log('running toast message in zone', toast);
		toast.click.subscribe((event: MouseEvent) => {
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
			}
			if (cardId) {
				const isAchievement = type === 'achievement-pre-record' || type === 'achievement-confirm';
				const isActiveAchievement =
					(type === 'achievement-pre-record' && toast.theClass === 'active') || type === 'achievement-confirm';
				if (isActiveAchievement) {
					console.log('sending message', this.mainWindowId);
					this.stateUpdater.next(new ShowAchievementDetailsEvent(cardId));
					this.notificationService.remove(toast.id);
				} else if (!isAchievement) {
					this.stateUpdater.next(new ShowCardDetailsEvent(cardId));
				}
			}
		});

		const activeNotif: ActiveNotification = {
			toast: toast,
			cardId: cardId,
			type: type,
		};
		this.activeNotifications.push(activeNotif);
	}

	private resize() {
		setTimeout(async () => {
			const wrapper = this.elRef.nativeElement.querySelector('.simple-notification-wrapper');
			const height = wrapper.getBoundingClientRect().height + 20;
			const width = 500;
			const gameInfo = await this.ow.getRunningGameInfo();
			if (!gameInfo) {
				return;
			}
			const gameWidth = gameInfo.logicalWidth;
			const gameHeight = gameInfo.logicalHeight;
			const dpi = gameWidth / gameInfo.width;
			await this.ow.changeWindowSize(this.windowId, width, height);
			// https://stackoverflow.com/questions/8388440/converting-a-double-to-an-int-in-javascript-without-rounding
			const newLeft = ~~(gameWidth - width * dpi);
			const newTop = ~~(gameHeight - height * dpi - 10);
			await this.ow.changeWindowPosition(this.windowId, newLeft, newTop);
		});
	}

	// private exitGame(gameInfoResult: any): boolean {
	// 	return (!gameInfoResult || !gameInfoResult.gameInfo || !gameInfoResult.gameInfo.isRunning);
	// }

	// private closeApp() {
	// 	overwolf.windows.getCurrentWindow((result) => {
	// 		if (result.status === "success") {
	// 			console.log('closing');
	// 			overwolf.windows.close(result.window.id);
	// 		}
	// 	});
	// }

	private async showSettings() {
		console.log('showing settings');
		const window = await this.ow.obtainDeclaredWindow('SettingsWindow');
		await this.ow.restoreWindow(window.id);
	}
}

interface ActiveNotification {
	readonly toast: Notification;
	readonly cardId?: string;
	readonly type?: string;
}
