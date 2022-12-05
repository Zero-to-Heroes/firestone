import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { SocialUserInfo } from '../../models/mainwindow/social-user-info';
import { capitalizeEachWord } from '../../services/utils';

@Component({
	selector: 'social-share-modal',
	styleUrls: [
		`../../../css/component/controls/controls.scss`,
		`../../../css/component/controls/control-close.component.scss`,
		`../../../css/component/sharing/social-share-modal.component.scss`,
	],
	template: `
		<div class="social-share-modal">
			<button class="i-30 close-button" (mousedown)="closeModal()">
				<svg class="svg-icon-fill">
					<use
						xmlns:xlink="https://www.w3.org/1999/xlink"
						xlink:href="assets/svg/sprite.svg#window-control_close"
					></use>
				</svg>
			</button>
			<div class="modal-title">
				<div class="network-icon" [inlineSVG]="networkSvg"></div>
				<div class="text">Share on {{ networkTitle }}</div>
			</div>
			<ng-content select=".share-preview"></ng-content>
			<section class="sharing-body" [ngClass]="{ disabled: !buttonEnabled }">
				<share-login
					[socialInfo]="_socialUserInfo"
					(onLoginRequest)="handleLoginRequest()"
					(onLogoutRequest)="handleLogoutRequest()"
				></share-login>
				<ng-content select=".share-main-body"></ng-content>
			</section>
			<button
				*ngIf="loggedIn"
				class="share-button"
				(mousedown)="share()"
				[ngClass]="{ invalid: !dataValid || !loggedIn }"
				[helpTooltip]="!dataValid || !loggedIn ? 'Please fill the mandatory data' : null"
			>
				Share
			</button>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SocialShareModalComponent {
	@Output() onShare: EventEmitter<string> = new EventEmitter<string>();
	@Output() onLoginRequest: EventEmitter<boolean> = new EventEmitter<boolean>();
	@Output() onLogoutRequest: EventEmitter<boolean> = new EventEmitter<boolean>();

	@Input() closeHandler: () => void;
	@Input() buttonEnabled: boolean;
	@Input() dataValid: boolean;

	@Input() set socialUserInfo(value: SocialUserInfo) {
		this._socialUserInfo = value;
		if (this._socialUserInfo) {
			this.networkSvg = `assets/svg/social/${this._socialUserInfo.network}.svg`;
			this.networkTitle = capitalizeEachWord(this._socialUserInfo.network);
			this.loggedIn = this._socialUserInfo.id != null;
		}
		console.log('setting socialUserInfo in modal', value);
	}

	_socialUserInfo: SocialUserInfo;
	networkTitle: string;
	networkSvg: string;
	loggedIn: boolean;

	share(text?: string) {
		if (this.dataValid && this.loggedIn) {
			console.log('handling share', text);
			this.onShare.next(text);
		}
	}

	handleLoginRequest() {
		this.onLoginRequest.next(true);
	}

	handleLogoutRequest() {
		this.onLogoutRequest.next(true);
	}

	closeModal() {
		this.closeHandler && this.closeHandler();
	}
}
