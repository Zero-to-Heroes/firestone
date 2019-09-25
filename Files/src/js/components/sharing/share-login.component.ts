import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { SocialUserInfo } from '../../models/mainwindow/social-user-info';
import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';
import { TriggerSocialNetworkLoginToggleEvent } from '../../services/mainwindow/store/events/social/trigger-social-network-login-toggle-event';
import { OverwolfService } from '../../services/overwolf.service';

@Component({
	selector: 'share-login',
	styleUrls: [`../../../css/component/sharing/share-login.component.scss`],
	template: `
		<div class="share-login">
			<div class="avatar-image">
				<div class="zth-tooltip top">
					<p>{{ username }}</p>
					<svg class="tooltip-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9">
						<polygon points="0,0 8,-9 16,0" />
					</svg>
				</div>
				<img [src]="loginImage" />
			</div>
			<button (mousedown)="logInOut()">{{ loggedIn ? 'Log out' : 'Log in' }}</button>
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

	constructor(private ow: OverwolfService) {}

	@Input() set socialInfo(value: SocialUserInfo) {
		if (!value) {
			return;
		}
		this.username = value.name;
		this.loggedIn = value.id != undefined;
		this.loginImage =
			this.loggedIn && value.avatarUrl ? value.avatarUrl : '/Files/assets/images/social-share-login.png';
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	logInOut() {
		this.stateUpdater.next(new TriggerSocialNetworkLoginToggleEvent(this.network));
	}
}
