/* eslint-disable no-mixed-spaces-and-tabs */
import { Injectable } from '@angular/core';
import { AbstractFacadeService, AppInjector, WindowManagerService } from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';
import { PreferencesService } from './preferences.service';

@Injectable()
export class NotificationsService extends AbstractFacadeService<NotificationsService> {
	public notifications$$: BehaviorSubject<Message | null>;

	private isDev: boolean;
	private prefs: PreferencesService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'OwNotificationsService', () => !!this.notifications$$);
	}

	protected override assignSubjects() {
		this.notifications$$ = this.mainInstance.notifications$$;
	}

	protected async init() {
		this.notifications$$ = new BehaviorSubject<Message | null>(null);
		this.prefs = AppInjector.get(PreferencesService);

		this.isDev = process.env['NODE_ENV'] !== 'production';
	}

	public async addNotification(htmlMessage: Message) {
		if (!(await this.prefs.getPreferences()).setAllNotifications) {
			console.log('not showing any notification');
			return;
		}
		this.notifications$$.next(htmlMessage);
	}

	// This directly share JS objects, without stringifying them, so it lets us do some
	// fancy stuff
	public async emitNewNotification(htmlMessage: Message, bypassPrefs = false) {
		console.debug('[notifications] getting ready to emit new notification', htmlMessage);
		if (!bypassPrefs && !(await this.prefs.getPreferences()).setAllNotifications) {
			console.debug('[notifications] not showing any notification');
			return;
		}
		console.debug('emitting new notification', htmlMessage);
		this.notifications$$.next(htmlMessage);
	}

	public notifyDebug(title: string, text: string, code: string) {
		if (!this.isDev) {
			return;
		}

		this.emitNewNotification({
			content: `
				<div class="general-message-container general-theme">
					<div class="firestone-icon">
						<svg class="svg-icon-fill">
							<use xlink:href="assets/svg/sprite.svg#ad_placeholder" />
						</svg>
					</div>
					<div class="message">
						<div class="title">
							<span>${title}</span>
						</div>
						<span class="text">${text}</span>
					</div>
					<button class="i-30 close-button">
						<svg class="svg-icon-fill">
							<use xmlns:xlink="https://www.w3.org/1999/xlink" xlink:href="assets/svg/sprite.svg#window-control_close"></use>
						</svg>
					</button>
				</div>`,
			notificationId: `${code}`,
		});
	}

	public notifyInfo(title: string | null, text: string | null, code: string) {
		this.emitNewNotification({
			content: `
				<div class="general-message-container general-theme">
					<div class="firestone-icon">
						<svg class="svg-icon-fill">
							<use xlink:href="assets/svg/sprite.svg#ad_placeholder" />
						</svg>
					</div>
					<div class="message">
						<div class="title">
							<span>${title}</span>
						</div>
						<span class="text">${text}</span>
					</div>
					<button class="i-30 close-button">
						<svg class="svg-icon-fill">
							<use xmlns:xlink="https://www.w3.org/1999/xlink" xlink:href="assets/svg/sprite.svg#window-control_close"></use>
						</svg>
					</button>
				</div>`,
			notificationId: `${code}`,
		});
	}

	public notifyError(title: string, text: string, code: string, onClick?: () => void | Promise<void>) {
		this.emitNewNotification(
			{
				content: `
				<div class="general-message-container general-theme">
					<div class="firestone-icon">
						<svg class="svg-icon-fill">
							<use xlink:href="assets/svg/sprite.svg#ad_placeholder" />
						</svg>
					</div>
					<div class="message">
						<div class="title">
							<span>${title}</span>
						</div>
						<span class="text">${text}</span>
					</div>
					<button class="i-30 close-button">
						<svg class="svg-icon-fill">
							<use xmlns:xlink="https://www.w3.org/1999/xlink" xlink:href="assets/svg/sprite.svg#window-control_close"></use>
						</svg>
					</button>
				</div>`,
				timeout: 99999999,
				notificationId: `${code}`,
				handlers: onClick
					? [
							{ selector: 'general-message-container', action: onClick },
							{ selector: 'message', action: onClick },
							{ selector: 'title', action: onClick },
							{ selector: 'text', action: onClick },
						]
					: undefined,
			},
			true,
		);
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
	eventToSendOnClick?: () => void;
	handlers?: readonly {
		selector: string;
		action: () => void | Promise<void>;
	}[];
}
