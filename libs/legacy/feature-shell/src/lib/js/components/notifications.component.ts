import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	ViewEncapsulation,
	ViewRef,
} from '@angular/core';
import { Message, PreferencesService } from '@firestone/shared/common/service';
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import {
	HorizontalPosition,
	Notification,
	NotificationType,
	NotificationsService,
	Options,
	VerticalPosition,
} from 'angular2-notifications';
import { Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map } from 'rxjs/operators';
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
	toastOptions: Options = {
		timeOut: this.timeout,
		pauseOnHover: false,
		showProgressBar: false,
		maxStack: 5,
		position: ['bottom', 'right'],
	};

	private activeNotifications: ActiveNotification[] = [];
	private notifications$: Observable<Message>;

	constructor(
		private readonly notificationService: NotificationsService,
		private readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly elRef: ElementRef,
		private readonly store: AppUiStoreFacadeService,
		private readonly prefs: PreferencesService,
	) {}

	async ngAfterViewInit() {
		await waitForReady(this.prefs);

		this.notifications$ = this.ow.getMainWindow().notificationsEmitterBus;
		this.notifications$
			.pipe(
				filter((message) => !!message),
				map((message) => {
					console.log('handling new notification', message?.type);
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

		this.prefs.preferences$$
			.pipe(
				debounceTime(200),
				map((prefs) => prefs.notificationsPosition),
				distinctUntilChanged(),
			)
			.subscribe((position) => {
				position = position ?? 'bottom-right';
				let sidePosition: HorizontalPosition = 'right';
				let topPosition: VerticalPosition = 'bottom';
				if (position.includes('right')) {
					// Change the left/right absolute positioning of the host
					this.elRef.nativeElement.style.right = '0px';
					this.elRef.nativeElement.style.left = 'auto';
					this.elRef.nativeElement.querySelector('simple-notifications').style.justifyContent = 'flex-end';
					this.elRef.nativeElement.querySelector('.simple-notification-wrapper').style.justifyContent =
						'flex-end';
					if (!!this.elRef.nativeElement.querySelector('.simple-notification')) {
						this.elRef.nativeElement.querySelector('.simple-notification').style.justifyContent =
							'flex-end';
					}
					sidePosition = 'right';
				} else {
					this.elRef.nativeElement.style.left = '10px';
					this.elRef.nativeElement.style.right = 'auto';
					this.elRef.nativeElement.querySelector('simple-notifications').style.justifyContent = 'flex-start';
					this.elRef.nativeElement.querySelector('.simple-notification-wrapper').style.justifyContent =
						'flex-start';
					if (!!this.elRef.nativeElement.querySelector('.simple-notification')) {
						this.elRef.nativeElement.querySelector('.simple-notification').style.justifyContent =
							'flex-start';
					}
					sidePosition = 'left';
				}
				if (position.includes('top')) {
					this.elRef.nativeElement.querySelector('.notifications').style.justifyContent = 'flex-start';
					topPosition = 'top';
				} else {
					this.elRef.nativeElement.querySelector('.notifications').style.justifyContent = 'flex-end';
					topPosition = 'bottom';
				}
				// Doesn't work?
				this.toastOptions.position = [topPosition, sidePosition];

				console.debug(
					'[notifications] changing position',
					this.toastOptions,
					// this.notificationService.globalOptions,
				);
				if (!(this.cdr as ViewRef)?.destroyed) {
					this.cdr.detectChanges();
				}
			});

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
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
}

interface ActiveNotification {
	readonly toast: Notification;
	readonly notificationId: string;
}
