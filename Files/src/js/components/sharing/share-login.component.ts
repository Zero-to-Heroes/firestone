import { Component, Input, ChangeDetectionStrategy, AfterViewInit, EventEmitter } from '@angular/core';

import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';
import { SocialUserInfo } from '../../models/mainwindow/social-user-info';
import { TriggerSocialNetworkLoginToggleEvent } from '../../services/mainwindow/store/events/social/trigger-social-network-login-toggle-event';

declare var overwolf;

@Component({
	selector: 'share-login',
	styleUrls: [
		`../../../css/component/sharing/share-login.component.scss`,
	],
	template: `
		<div class="share-login">
			<div class="avatar-image">
				<div class="zth-tooltip top">
					<p>{{username}}</p>
					<svg class="tooltip-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9">
						<polygon points="0,0 8,-9 16,0"/>
					</svg>
				</div>
				<img [src]="loginImage">
			</div>
			<button (click)="logInOut()">{{loggedIn ? 'Log out' : 'Log in'}}</button>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShareLoginComponent implements AfterViewInit {

	@Input() network: string;
	loggedIn: boolean;
	loginImage: string;
	username: string;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	@Input() set socialInfo(value: SocialUserInfo) { 
		if (!value) {
			return;
		}
		this.username = value.name;
		this.loggedIn = value.id != undefined;
		const loginImageName = this.loggedIn
				? 'social-share-login.png'
				: 'social-share-login.png';
		this.loginImage = `/Files/assets/images/${loginImageName}`;
	}

	ngAfterViewInit() {
		this.stateUpdater = overwolf.windows.getMainWindow().mainWindowStoreUpdater;
	}

	logInOut() {
		this.stateUpdater.next(new TriggerSocialNetworkLoginToggleEvent(this.network));
	}

}
