import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { filter, map, tap, withLatestFrom } from 'rxjs/operators';
import { MainWindowStoreEvent } from './mainwindow/store/events/main-window-store-event';
import { OverwolfService } from './overwolf.service';
import { PreferencesService } from './preferences.service';

@Injectable()
export class OwNotificationsService {
	private windowId: string;
	private messageId = 0;
	// Because if we start the app during a game, it might take some time for the notif window to
	// be created
	private retriesLeft = 30;

	private stateEmitter = new BehaviorSubject<Message>(undefined);

	constructor(private readonly ow: OverwolfService, private readonly prefs: PreferencesService) {
		// Give it time to boot
		setTimeout(() => this.detectNotificationsWindow(), 5000);

		window['notificationsEmitterBus'] = this.stateEmitter.pipe(
			withLatestFrom(this.prefs.getPreferences()),
			filter(([message, preferences]) => preferences.setAllNotifications),
			map(([message]) => message),
			tap((message) => console.log('notification service', message)),
		);
	}

	public addNotification(htmlMessage: Message): void {
		this.stateEmitter.next(htmlMessage);
	}

	// This directly share JS objects, without stringifying them, so it lets us do some
	// fancy stuff
	public async emitNewNotification(htmlMessage: Message) {
		if (!(await this.prefs.getPreferences()).setAllNotifications) {
			console.log('not showing any notification');
			return;
		}
		if (!this.windowId) {
			if (this.retriesLeft <= 0) {
				throw new Error('NotificationsWindow was not identified at app start');
			} else {
				this.retriesLeft--;
				setTimeout(() => {
					this.emitNewNotification(htmlMessage);
				}, 500);
				return;
			}
		}
		this.stateEmitter.next(htmlMessage);
	}

	private async detectNotificationsWindow() {
		const window = await this.ow.obtainDeclaredWindow(OverwolfService.NOTIFICATIONS_WINDOW);
		const windowId = window.id;
		// await this.ow.restoreWindow(windowId);
		await this.ow.hideWindow(windowId);
		this.windowId = windowId;
	}
}

export interface Message {
	notificationId: string;
	content: string;
	cardId?: string;
	type?: string;
	app?: 'achievement' | 'collection' | 'decktracker' | 'replays';
	timeout?: number;
	theClass?: string;
	clickToClose?: boolean;
	eventToSendOnClick?: () => MainWindowStoreEvent;
}
