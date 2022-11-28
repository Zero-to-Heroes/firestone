import { Injectable } from '@angular/core';
import { ApiRunner } from './api-runner';
import { CurrentUserEvent } from './mainwindow/store/events/current-user-event';
import { MainWindowStoreService } from './mainwindow/store/main-window-store.service';
import { OverwolfService } from './overwolf.service';

// const USER_MAPPING_URL = 'https://08fe814cde.execute-api.us-west-2.amazonaws.com/Prod/userMapping';
const USER_MAPPING_UPDATE_URL = 'https://api.firestoneapp.com/usermapping/save/usermapping/{proxy+}';

@Injectable()
export class UserService {
	private currentUser: overwolf.profile.GetCurrentUserResult;
	private store: MainWindowStoreService;

	constructor(private readonly ow: OverwolfService, private readonly api: ApiRunner) {}

	public async getCurrentUser(): Promise<overwolf.profile.GetCurrentUserResult> {
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
		if (this.currentUser?.username) {
			setTimeout(async () => {
				// The avatar is not set right away
				this.currentUser = await this.ow.getCurrentUser();
				this.store.stateUpdater.next(new CurrentUserEvent(this.currentUser));
			}, 2000);
		}
	}

	private async sendCurrentUser() {
		// Don't send anything in dev to allow for impersonation
		if (process.env.NODE_ENV !== 'production') {
			console.warn('not sending user mapping in dev');
			return;
		}

		this.currentUser = await this.ow.getCurrentUser();
		return this.api.callPostApi(USER_MAPPING_UPDATE_URL, {
			userId: this.currentUser.userId,
			userName: this.currentUser.username,
		});
	}

	private waitForInit(): Promise<void> {
		return new Promise<void>((resolve) => {
			const dbWait = () => {
				if (this.currentUser) {
					resolve();
				} else {
					setTimeout(() => dbWait(), 50);
				}
			};
			dbWait();
		});
	}
}
