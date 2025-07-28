import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { OverwolfService } from '@firestone/shared/framework/core';
import { SocialUserInfo } from '../../models/mainwindow/social-user-info';

@Component({
	standalone: false,
	selector: 'share-login',
	styleUrls: [`../../../css/component/sharing/share-login.component.scss`],
	template: `
		<div class="share-login">
			<div class="avatar-image" [helpTooltip]="username">
				<img [src]="loginImage" />
			</div>
			<button (mousedown)="logInOut()">
				{{ loggedIn ? ('app.share.logout-button' | owTranslate) : ('app.share.login-button' | owTranslate) }}
			</button>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShareLoginComponent {
	@Output() onLogoutRequest: EventEmitter<boolean> = new EventEmitter<boolean>();
	@Output() onLoginRequest: EventEmitter<boolean> = new EventEmitter<boolean>();

	@Input() set socialInfo(value: SocialUserInfo) {
		if (!value) {
			return;
		}
		this.username = value.name;
		this.loggedIn = value.id != undefined;
		this.loginImage =
			this.loggedIn && value.avatarUrl
				? value.avatarUrl
				: 'https://static.zerotoheroes.com/hearthstone/asset/firestone/images/social-share-login.png';
	}

	loggedIn: boolean;
	loginImage: string;
	username: string;

	constructor(private ow: OverwolfService) {}

	logInOut() {
		this.loggedIn ? this.onLogoutRequest.next(true) : this.onLoginRequest.next(true);
	}
}
