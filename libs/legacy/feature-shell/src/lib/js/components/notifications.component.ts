import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	HostListener,
	OnDestroy,
	ViewEncapsulation,
	ViewRef,
} from '@angular/core';
import { OverwolfService } from '@firestone/shared/framework/core';
import { Notification, NotificationType, NotificationsService } from 'angular2-notifications';
import { Observable, Subscription } from 'rxjs';
import { concatMap, filter, map, tap } from 'rxjs/operators';
import { DebugService } from '../services/debug.service';
import { ShowAchievementDetailsEvent } from '../services/mainwindow/store/events/achievements/show-achievement-details-event';
import { ShowCardDetailsEvent } from '../services/mainwindow/store/events/collection/show-card-details-event';
import { Message } from '../services/notifications.service';
import { PreferencesService } from '../services/preferences.service';
import { AppUiStoreFacadeService } from '../services/ui-store/app-ui-store-facade.service';

@Component({
	selector: 'notifications',
	styleUrls: [
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
	private gameInfoListener: (message: any) => void;

	private activeNotifications: ActiveNotification[] = [];
	private notifications$: Observable<Message>;

	constructor(
		private notificationService: NotificationsService,
		private cdr: ChangeDetectorRef,
		private debugService: DebugService,
		private ow: OverwolfService,
		private elRef: ElementRef,
		private prefs: PreferencesService,
		private readonly store: AppUiStoreFacadeService,
	) {
		this.init();
	}

	private async init() {
		this.notifications$ = this.ow.getMainWindow().notificationsEmitterBus;
		this.windowId = (await this.ow.getCurrentWindow()).id;
		await this.ow.restoreWindow(this.windowId);
		await this.ow.bringToFront(this.windowId);

		this.notifications$
			.pipe(
				filter((message) => !!message),
				map((message) => {
					// Don't await them because we don't want to block the main thread
					const toast = this.buildToastNotification(message);
					toast.theClass = message.theClass;
					console.debug('handling new notification', message, toast);
					return { message, toast };
				}),
				concatMap(({ message, toast }) =>
					toast.click.pipe(
						tap((clickEvent: MouseEvent) => this.handleToastClick(clickEvent, message, toast.id)),
					),
				),
			)
			.subscribe();
	}

	async ngAfterViewInit() {
		this.gameInfoListener = this.ow.addGameInfoUpdatedListener((message) => {
			if (message.resolutionChanged || message.runningChanged) {
				this.resize();
			}
		});
		this.windowId = (await this.ow.getCurrentWindow()).id;
		this.resize();
	}

	@HostListener('window:beforeunload')
	ngOnDestroy(): void {
		this.ow.removeGameInfoUpdatedListener(this.gameInfoListener);
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

	private buildToastNotification(message: Message): Notification {
		const override: any = {
			timeOut: message.timeout || this.timeout,
			clickToClose: message.clickToClose === false ? false : true,
		};
		return this.notificationService.html(message.content, NotificationType.Success, override);
	}

	private isUnclickable(event: MouseEvent): boolean {
		let currentElement: any = event.srcElement;
		while (currentElement && !currentElement.classList.contains('unclickable') && currentElement.parentElement) {
			currentElement = currentElement.parentElement;
		}
		return currentElement && currentElement.className && currentElement.className.includes('unclickable');
	}

	private isClickOnCloseButton(event: MouseEvent): boolean {
		let currentElement: any = event.srcElement;
		while (currentElement && (!currentElement.className || !currentElement.className.indexOf)) {
			currentElement = currentElement.parentElement;
		}
		return currentElement && currentElement.className && currentElement.className.includes('close');
	}

	private handleToastClick(event: MouseEvent, messageObject: Message, toastId: string): void {
		const isClickOnCloseButton = this.isClickOnCloseButton(event);
		if (isClickOnCloseButton) {
			this.notificationService.remove(toastId);
			return;
		}

		const isUnclickable = this.isUnclickable(event);
		if (isUnclickable) {
			event.preventDefault();
			event.stopPropagation();
			return;
		}

		for (const handler of messageObject.handlers ?? []) {
			if ((<HTMLElement>event.target).className.indexOf(handler.selector) > -1) {
				this.notificationService.remove(toastId);
				handler.action();
			}
		}

		if (messageObject.cardId) {
			const isAchievement = messageObject.app === 'achievement';
			if (isAchievement) {
				this.store.send(new ShowAchievementDetailsEvent(messageObject.cardId));
				this.fadeNotificationOut(messageObject.notificationId);
			} else {
				this.store.send(new ShowCardDetailsEvent(messageObject.cardId));
			}
			return;
		}

		if (!messageObject.eventToSendOnClick) {
			return;
		}

		messageObject.eventToSendOnClick();
	}

	private fadeNotificationOut(notificationId: string) {
		const activeNotif = this.activeNotifications.find((notif) => notif.notificationId === notificationId);
		if (!activeNotif) {
			return;
		}
		const notification = this.elRef.nativeElement.querySelector('.' + notificationId);
		if (!notification) {
			return;
		}
		notification.classList.add('fade-out');
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
			if (!gameInfo) {
				return;
			}

			const gameWidth = gameInfo.logicalWidth;
			const dpi = gameWidth / gameInfo.width;
			await this.ow.changeWindowSize(this.windowId, width, gameInfo.height - 20);
			// https://stackoverflow.com/questions/8388440/converting-a-double-to-an-int-in-javascript-without-rounding
			const newLeft = gameWidth - width * dpi;
			const newTop = 1;
			await this.ow.changeWindowPosition(this.windowId, newLeft, newTop);
		});
	}
}

interface ActiveNotification {
	readonly toast: Notification;
	readonly subscription: Subscription;
	readonly notificationId: string;
	readonly type?: string;
}
