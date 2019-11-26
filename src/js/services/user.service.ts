import { Injectable } from '@angular/core';
import { CurrentUser } from '../models/overwolf/profile/current-user';
import { CurrentUserEvent } from './mainwindow/store/events/current-user-event';
import { MainWindowStoreService } from './mainwindow/store/main-window-store.service';
import { OverwolfService } from './overwolf.service';

@Injectable()
export class UserService {
	private currentUser: CurrentUser;
	private store: MainWindowStoreService;

	constructor(private readonly ow: OverwolfService) {}

	public async getCurrentUser(): Promise<CurrentUser> {
		await this.waitForInit();
		return this.currentUser;
	}

	public init(store: MainWindowStoreService) {
		this.store = store;
		this.retrieveUserInfo();
		this.ow.addLoginStateChangedListener(() => this.retrieveUserInfo());
	}

	private async retrieveUserInfo() {
		this.currentUser = await this.ow.getCurrentUser();
		console.log('retrieved user info', this.currentUser);
		this.store.stateUpdater.next(new CurrentUserEvent(this.currentUser));
	}

	private waitForInit(): Promise<void> {
		return new Promise<void>(resolve => {
			const dbWait = () => {
				if (this.currentUser) {
					resolve();
				} else {
					// console.log('[achievements] [storage] waiting for init');
					setTimeout(() => dbWait(), 50);
				}
			};
			dbWait();
		});
	}
}
