import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CurrentUser } from '../models/overwolf/profile/current-user';
import { CurrentUserEvent } from './mainwindow/store/events/current-user-event';
import { MainWindowStoreService } from './mainwindow/store/main-window-store.service';
import { OverwolfService } from './overwolf.service';

const USER_MAPPING_URL = 'https://08fe814cde.execute-api.us-west-2.amazonaws.com/Prod/userMapping';

@Injectable()
export class UserService {
	private currentUser: CurrentUser;
	private store: MainWindowStoreService;

	constructor(private readonly ow: OverwolfService, private http: HttpClient) {}

	public async getCurrentUser(): Promise<CurrentUser> {
		await this.waitForInit();
		return this.currentUser;
	}

	public async init(store: MainWindowStoreService) {
		this.store = store;
		await this.retrieveUserInfo();
		this.ow.addLoginStateChangedListener(() => this.retrieveUserInfo());
	}

	private async retrieveUserInfo() {
		this.currentUser = await this.ow.getCurrentUser();
		console.log('retrieved user info', this.currentUser);
		await this.sendCurrentUser();
		this.store.stateUpdater.next(new CurrentUserEvent(this.currentUser));
	}

	private async sendCurrentUser() {
		// Don't send anything in dev to allow for impersonation
		if (process.env.NODE_ENV !== 'production') {
			console.warn('not sending user mapping in dev');
			return;
		}

		this.currentUser = await this.ow.getCurrentUser();
		return new Promise<void>(resolve => {
			this.http
				.post(USER_MAPPING_URL, {
					userId: this.currentUser.userId,
					userName: this.currentUser.username,
				})
				.subscribe(
					result => {
						// Do nothing
						resolve();
					},
					error => {
						console.error('Could not upload user mapping', error);
						resolve();
					},
				);
		});
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
