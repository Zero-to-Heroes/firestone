import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { SocialUserInfo } from '../../models/mainwindow/social-user-info';
import { capitalizeEachWord } from '../../services/utils';

@Component({
	selector: 'social-share-modal',
	styleUrls: [
		`../../../css/global/scrollbar.scss`,
		`../../../css/component/controls/controls.scss`,
		`../../../css/component/controls/control-close.component.scss`,
		`../../../css/component/sharing/social-share-modal.component.scss`,
	],
	template: `
		<div class="social-share-modal" *ngIf="_socialUserInfo">
			<button class="i-30 close-button" (mousedown)="closeModal()">
				<svg class="svg-icon-fill">
					<use
						xmlns:xlink="https://www.w3.org/1999/xlink"
						xlink:href="assets/svg/sprite.svg#window-control_close"
					></use>
				</svg>
			</button>
			<div class="modal-title">
				<ng-content select=".network-icon"></ng-content>
				<div class="text">Share on {{ networkTitle }}</div>
			</div>
			<ng-content select=".share-preview"></ng-content>
			<section class="sharing-body" [ngClass]="{ 'disabled': !buttonEnabled }">
				<share-login
					[socialInfo]="_socialUserInfo"
					(onLoginRequest)="handleLoginRequest()"
					(onLogoutRequest)="handleLogoutRequest()"
				></share-login>
				<share-info [loggedIn]="_socialUserInfo.id != null" (onShare)="handleShare($event)"> </share-info>
			</section>
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

	@Input() set socialUserInfo(value: SocialUserInfo) {
		console.log('setting socialUserInfo in modal', value);
		this._socialUserInfo = value;
		if (this._socialUserInfo) {
			this.networkTitle = capitalizeEachWord(this._socialUserInfo.network);
		}
	}

	_socialUserInfo: SocialUserInfo;
	networkTitle: string;

	handleShare(text: string) {
		this.onShare.next(text);
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
