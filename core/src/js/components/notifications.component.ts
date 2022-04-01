import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	EventEmitter,
	HostListener,
	OnDestroy,
	ViewEncapsulation,
	ViewRef,
} from '@angular/core';
import { Notification, NotificationsService, NotificationType } from 'angular2-notifications';
import { Observable, Subscription } from 'rxjs';
import { concatMap, filter, map, tap } from 'rxjs/operators';
import { DebugService } from '../services/debug.service';
import { ShowAchievementDetailsEvent } from '../services/mainwindow/store/events/achievements/show-achievement-details-event';
import { ShowCardDetailsEvent } from '../services/mainwindow/store/events/collection/show-card-details-event';
import { MainWindowStoreEvent } from '../services/mainwindow/store/events/main-window-store-event';
import { Message } from '../services/notifications.service';
import { OverwolfService } from '../services/overwolf.service';
import { PreferencesService } from '../services/preferences.service';
import { ProcessingQueue } from '../services/processing-queue.service';

declare let amplitude;

@Component({
	selector: 'notifications',
	styleUrls: [
		'../../css/global/components-global.scss',
		'../../css/component/notifications/notifications.component.scss',
		'../../css/component/notifications/notifications-achievements.scss',
		'../../css/component/notifications/notifications-decktracker.scss',
		'../../css/component/notifications/notifications-replays.scss',
		'../../css/component/notifications/notifications-general.scss',
		'../../css/component/notifications/notifications-rewards.scss',
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
// TODO: https://github.com/scttcper/ngx-toastr (19/11/2020)
export class NotificationsComponent implements AfterViewInit, OnDestroy {
	timeout = 6000;
	// timeout = 9999999;
	toastOptions = {
		timeOut: this.timeout,
		pauseOnHover: false,
		showProgressBar: false,
		maxStack: 5,
	};

	private windowId: string;
	// private windowId$: Observable<string>;
	private activeNotifications: ActiveNotification[] = [];
	private notifications$: Observable<Message>;
	private messageReceivedListener: (message: any) => void;
	private gameInfoListener: (message: any) => void;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;
	private settingsEventBus: EventEmitter<[string, string]>;

	private processingQueue = new ProcessingQueue<Message>(
		(eventQueue) => this.processQueue(eventQueue),
		200,
		'notifications',
	);

	constructor(
		private notificationService: NotificationsService,
		private cdr: ChangeDetectorRef,
		private debugService: DebugService,
		private ow: OverwolfService,
		private elRef: ElementRef,
		private prefs: PreferencesService,
	) {
		this.init();
	}

	private async init() {
		console.log('init starting');
		this.notifications$ = this.ow.getMainWindow().notificationsEmitterBus;
		this.windowId = (await this.ow.getCurrentWindow()).id;
		console.log('got window id');
		await this.ow.restoreWindow(this.windowId);
		await this.ow.bringToFront(this.windowId);
		console.log('brought window to front');

		this.notifications$
			.pipe(
				tap((info) => console.log('inital notification', info)),
				filter((message) => !!message),
				tap((info) => console.log('before delay', info)),
				map((message) => {
					// Don't await them because we don't want to block the main thread
					console.log('after window restore');
					const toast = this.getToastNotification(message);
					console.log('got toast notification', toast);
					toast.theClass = message.theClass;
					return { message, toast };
				}),
				tap((info) => console.log('after toast', info)),
				concatMap(({ message, toast }) =>
					toast.click.pipe(
						tap((clickEvent: MouseEvent) => this.handleToastClick(clickEvent, message, toast.id)),
					),
				),
				tap((info) => console.log('end', info)),
			)
			.subscribe();
	}

	async ngAfterViewInit() {
		// this.cdr.detach();
		this.messageReceivedListener = this.ow.addMessageReceivedListener((message) => {
			const messageObject: Message = JSON.parse(message.content);
			this.processingQueue.enqueue(messageObject);
		});
		this.gameInfoListener = this.ow.addGameInfoUpdatedListener((message) => {
			this.resize();
		});
		this.windowId = (await this.ow.getCurrentWindow()).id;
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
		this.settingsEventBus = this.ow.getMainWindow().settingsEventBus;
		this.resize();
	}

	private async processQueue(eventQueue: readonly Message[]): Promise<readonly Message[]> {
		const event = eventQueue[0];
		await this.sendNotification(event);
		return eventQueue.slice(1);
	}

	@HostListener('window:beforeunload')
	ngOnDestroy(): void {
		this.ow.removeGameInfoUpdatedListener(this.gameInfoListener);
		this.ow.removeMessageReceivedListener(this.messageReceivedListener);
	}

	created(event) {
		console.log('notif created', event.id);
	}

	destroyed(event) {
		console.log('notif destroyed', event.id);
		const deletedNotifications = this.activeNotifications.filter((notif) => notif.toast.id === event.id);
		deletedNotifications.forEach((notif) => notif.subscription.unsubscribe());
		this.activeNotifications = this.activeNotifications.filter((notif) => notif.toast.id !== event.id);
	}

	private async sendNotification(messageObject: Message): Promise<void> {
		return new Promise<void>(async (resolve) => {
			await this.waitForInit();

			await this.showNotification(messageObject);
			resolve();
			return;
		});
	}

	private getToastNotification(message: Message): Notification {
		const override: any = {
			timeOut: message.timeout || this.timeout,
			clickToClose: message.clickToClose === false ? false : true,
		};
		return this.notificationService.html(message.content, NotificationType.Success, override);
	}

	private handleToastClick(event: MouseEvent, messageObject: Message, toastId: string): void {
		console.log('registered click on toast', messageObject);
		let currentElement: any = event.srcElement;
		while (currentElement && (!currentElement.className || !currentElement.className.indexOf)) {
			currentElement = currentElement.parentElement;
		}

		// Clicked on close, don't show the card
		if (currentElement && currentElement.className && currentElement.className.indexOf('close') !== -1) {
			// amplitude
			// 	.getInstance()
			// 	.logEvent('notification', { 'event': 'close', 'app': messageObject.app, 'type': type });
			// Force close if it's not configured to auto close
			if (messageObject.clickToClose === false) {
				this.notificationService.remove(toastId);
			}
			console.log('closing notif');
			// this.notificationService.remove(toast.id);
			return;
		}

		// Clicked on settings, don't show the card and don't close
		if (currentElement && currentElement.className && currentElement.className.indexOf('open-settings') !== -1) {
			amplitude.getInstance().logEvent('notification', {
				'event': 'show-settings',
				'app': messageObject.app,
				'type': messageObject.type,
			});
			event.preventDefault();
			event.stopPropagation();
			this.showSettings();
			return;
		}

		while (currentElement && !currentElement.classList.contains('unclickable') && currentElement.parentElement) {
			currentElement = currentElement.parentElement;
		}

		if (currentElement && currentElement.classList.contains('unclickable')) {
			amplitude.getInstance().logEvent('notification', {
				'event': 'unclickable',
				'app': messageObject.app,
				'type': messageObject.type,
			});
			currentElement.classList.add('shake');
			setTimeout(() => {
				currentElement.classList.remove('shake');
			}, 500);
			event.preventDefault();
			event.stopPropagation();
			console.log('unclickable');
			return;
		}
		amplitude
			.getInstance()
			.logEvent('notification', { 'event': 'click', 'app': messageObject.app, 'type': messageObject.type });
		if (messageObject.eventToSendOnClick) {
			console.log('event to send on click', messageObject.eventToSendOnClick);
			const eventToSend = messageObject.eventToSendOnClick();
			this.stateUpdater.next(eventToSend);
		}
		if (messageObject.cardId) {
			const isAchievement = messageObject.app === 'achievement';
			if (isAchievement) {
				this.stateUpdater.next(new ShowAchievementDetailsEvent(messageObject.cardId));
				this.fadeNotificationOut(messageObject.notificationId);
			} else {
				this.stateUpdater.next(new ShowCardDetailsEvent(messageObject.cardId));
			}
		}
	}

	private async showNotification(messageObject: Message) {
		return new Promise<void>(async (resolve) => {
			const htmlMessage: string = messageObject.content;
			const cardId: string = messageObject.cardId;
			const type: string = messageObject.type;
			const timeout: number = messageObject.timeout || this.timeout;
			await this.ow.restoreWindow(this.windowId);
			this.ow.bringToFront(this.windowId);
			const override: any = {
				timeOut: timeout,
				clickToClose: messageObject.clickToClose === false ? false : true,
			};

			const toast = this.notificationService.html(htmlMessage, NotificationType.Success, override);
			toast.theClass = messageObject.theClass;

			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}

			const subscription: Subscription = toast.click.subscribe((event: MouseEvent) => {
				console.log('registered click on toast', messageObject);
				let currentElement: any = event.srcElement;
				while (currentElement && (!currentElement.className || !currentElement.className.indexOf)) {
					currentElement = currentElement.parentElement;
				}

				// Clicked on close, don't show the card
				if (currentElement && currentElement.className && currentElement.className.indexOf('close') !== -1) {
					// amplitude
					// 	.getInstance()
					// 	.logEvent('notification', { 'event': 'close', 'app': messageObject.app, 'type': type });
					// Force close if it's not configured to auto close
					if (override.clickToClose === false) {
						this.notificationService.remove(toast.id);
					}
					console.log('closing notif');
					// this.notificationService.remove(toast.id);
					return;
				}
				// Clicked on settings, don't show the card and don't close
				if (
					currentElement &&
					currentElement.className &&
					currentElement.className.indexOf('open-settings') !== -1
				) {
					amplitude
						.getInstance()
						.logEvent('notification', { 'event': 'show-settings', 'app': messageObject.app, 'type': type });
					event.preventDefault();
					event.stopPropagation();
					this.showSettings();

					return;
				}

				while (
					currentElement &&
					!currentElement.classList.contains('unclickable') &&
					currentElement.parentElement
				) {
					currentElement = currentElement.parentElement;
				}

				if (currentElement && currentElement.classList.contains('unclickable')) {
					amplitude
						.getInstance()
						.logEvent('notification', { 'event': 'unclickable', 'app': messageObject.app, 'type': type });
					currentElement.classList.add('shake');
					setTimeout(() => {
						currentElement.classList.remove('shake');
					}, 500);
					event.preventDefault();
					event.stopPropagation();
					console.log('unclickable');
					return;
				}
				amplitude
					.getInstance()
					.logEvent('notification', { 'event': 'click', 'app': messageObject.app, 'type': type });
				if (messageObject.eventToSendOnClick) {
					console.log('event to send on click', messageObject.eventToSendOnClick);
					const eventToSend = messageObject.eventToSendOnClick();
					this.stateUpdater.next(eventToSend);
				}
				if (cardId) {
					const isAchievement = messageObject.app === 'achievement';
					if (isAchievement) {
						this.stateUpdater.next(new ShowAchievementDetailsEvent(cardId));
						this.fadeNotificationOut(messageObject.notificationId);
					} else {
						this.stateUpdater.next(new ShowCardDetailsEvent(cardId));
					}
				}
				if (!(this.cdr as ViewRef)?.destroyed) {
					this.cdr.detectChanges();
				}
			});
			const activeNotif: ActiveNotification = {
				toast: toast,
				subscription: subscription,
				notificationId: messageObject.notificationId,
				type: type,
			};
			this.activeNotifications.push(activeNotif);
			amplitude
				.getInstance()
				.logEvent('notification', { 'event': 'show', 'app': messageObject.app, 'type': type });
			console.log('added notif to active notifs', this.activeNotifications, activeNotif);
			resolve();

			setTimeout(() => {
				let notification;
				try {
					notification = this.elRef.nativeElement.querySelector('.' + messageObject.notificationId);
				} catch (e) {}
				if (notification) {
					notification.classList.add(messageObject.theClass);
				}
			}, 200);
		});
	}

	private fadeNotificationOut(notificationId: string) {
		const activeNotif = this.activeNotifications.find((notif) => notif.notificationId === notificationId);
		if (!activeNotif) {
			console.log('activeNotif already removed', notificationId, this.activeNotifications);
			return;
		}
		const notification = this.elRef.nativeElement.querySelector('.' + notificationId);
		if (!notification) {
			console.log('notif already removed', notificationId, this.activeNotifications);
			return;
		}
		notification.classList.add('fade-out');
		console.log('manually fading out notification', notificationId);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
		const toast = activeNotif.toast;
		setTimeout(() => {
			this.notificationService.remove(toast.id);
		}, 500);
	}

	private resize() {
		setTimeout(async () => {
			const width = 500;
			const gameInfo = await this.ow.getRunningGameInfo();

			console.log('game info', gameInfo, this.activeNotifications.length);
			if (!gameInfo) {
				return;
			}
			const gameWidth = gameInfo.logicalWidth;
			// const gameHeight = gameInfo.logicalHeight;
			const dpi = gameWidth / gameInfo.width;
			await this.ow.changeWindowSize(this.windowId, width, gameInfo.height - 20);
			console.log('changing notifs window size', width, gameInfo.height - 20, dpi);
			// https://stackoverflow.com/questions/8388440/converting-a-double-to-an-int-in-javascript-without-rounding
			const newLeft = gameWidth - width;
			const newTop = 1;
			console.log('changing notifs window position', newLeft, newTop);
			await this.ow.changeWindowPosition(this.windowId, newLeft, newTop);
		});
	}

	private async showSettings() {
		console.log('showing settings');
		this.settingsEventBus.next(['achievements', 'capture']);
		const prefs = await this.prefs.getPreferences();
		const window = await this.ow.getSettingsWindow(prefs);
		await this.ow.restoreWindow(window.id);
		this.ow.bringToFront(window.id);
	}

	private waitForInit(): Promise<void> {
		return new Promise<void>((resolve) => {
			const theWait = () => {
				if (this.windowId) {
					resolve();
				} else {
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
