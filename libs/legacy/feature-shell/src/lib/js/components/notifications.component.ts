import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	ViewEncapsulation,
	ViewRef,
} from '@angular/core';
import { Message } from '@firestone/shared/common/service';
import { OverwolfService } from '@firestone/shared/framework/core';
import { Notification, NotificationType, NotificationsService } from 'angular2-notifications';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { ShowAchievementDetailsEvent } from '../services/mainwindow/store/events/achievements/show-achievement-details-event';
import { ShowCardDetailsEvent } from '../services/mainwindow/store/events/collection/show-card-details-event';
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
			<simple-notifications [options]="toastOptions" (create)="created($event)" (destroy)="destroyed($event)">
			</simple-notifications>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
// Maybe use https://www.npmjs.com/package/ngx-toastr instead
// TODO: https://github.com/scttcper/ngx-toastr (19/11/2020)
export class NotificationsComponent implements AfterViewInit {
	timeout = 6000;
	// timeout = 9999999;
	toastOptions = {
		timeOut: this.timeout,
		pauseOnHover: false,
		showProgressBar: false,
		maxStack: 5,
	};

	// private windowId: string;
	// private gameInfoListener: (message: any) => void;

	private activeNotifications: ActiveNotification[] = [];
	private notifications$: Observable<Message>;

	constructor(
		private readonly notificationService: NotificationsService,
		private readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly elRef: ElementRef,
		private readonly store: AppUiStoreFacadeService,
	) {}

	ngAfterViewInit() {
		this.notifications$ = this.ow.getMainWindow().notificationsEmitterBus;
		this.notifications$
			.pipe(
				filter((message) => !!message),
				map((message) => {
					console.debug('handling new notification', message);
					// Don't await them because we don't want to block the main thread
					const toast = this.buildToastNotification(message);
					if (!toast) {
						return null;
					}
					toast.theClass = message.theClass;
					return { message, toast };
				}),
			)
			.subscribe();
	}

	created(event) {
		console.log('[notifications] notif created', event.id);
	}

	destroyed(event) {
		console.log('[notifications] notif destroyed', event.id);
		const deletedNotifications = this.activeNotifications.filter((notif) => notif.toast.id === event.id);
		deletedNotifications.forEach((notif) => {
			(notif.toast as any).subscription.unsubscribe();
		});
		this.activeNotifications = this.activeNotifications.filter((notif) => notif.toast.id !== event.id);
	}

	private buildToastNotification(message: Message): Notification {
		// if (this.activeNotifications.some((n) => n.notificationId === message.notificationId)) {
		// 	console.debug('[notifications] notification already active', message);
		// 	return null;
		// }

		const override: any = {
			timeOut: message.timeout || this.timeout,
			clickToClose: message.clickToClose === false ? false : true,
		};
		const toast = this.notificationService.html(message.content, NotificationType.Success, override);
		(toast as any).subscription = toast.click.subscribe((clickEvent: MouseEvent) =>
			this.handleToastClick(clickEvent, message, toast.id),
		);

		this.activeNotifications.push({
			notificationId: message.notificationId,
			toast: toast,
		});
		console.debug('[notifications] notification added', toast, this.activeNotifications);
		return toast;
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
		console.debug('[notifications] handling toast click', event, messageObject, toastId);
		const isClickOnCloseButton = this.isClickOnCloseButton(event);
		if (isClickOnCloseButton) {
			console.debug('[notifications] click on close button, removing notification', toastId);
			this.notificationService.remove(toastId);
			return;
		}

		const isUnclickable = this.isUnclickable(event);
		if (isUnclickable) {
			console.debug('[notifications] click on unclickable area, ignoring', toastId);
			event.preventDefault();
			event.stopPropagation();
			return;
		}

		for (const handler of messageObject.handlers ?? []) {
			if ((<HTMLElement>event.target).className.indexOf(handler.selector) > -1) {
				console.debug('[notifications] handling click', handler);
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

	// private resize() {
	// 	setTimeout(async () => {
	// 		const width = 500;
	// 		const gameInfo = await this.ow.getRunningGameInfo();
	// 		if (!gameInfo) {
	// 			return;
	// 		}

	// 		const gameWidth = gameInfo.logicalWidth;
	// 		const dpi = gameWidth / gameInfo.width;
	// 		await this.ow.changeWindowSize(this.windowId, width, gameInfo.height - 20);
	// 		// https://stackoverflow.com/questions/8388440/converting-a-double-to-an-int-in-javascript-without-rounding
	// 		const newLeft = gameWidth - width * dpi;
	// 		const newTop = 1;
	// 		await this.ow.changeWindowPosition(this.windowId, newLeft, newTop);
	// 	});
	// }
}

interface ActiveNotification {
	readonly toast: Notification;
	// readonly subscription: Subscription;
	readonly notificationId: string;
	// readonly type?: string;
}
