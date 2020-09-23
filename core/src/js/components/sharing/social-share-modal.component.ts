import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { SocialUserInfo } from '../../models/mainwindow/social-user-info';

@Component({
	selector: 'social-share-modal',
	styleUrls: [
		`../../../css/global/scrollbar.scss`,
		`../../../css/component/controls/controls.scss`,
		`../../../css/component/controls/control-close.component.scss`,
		`../../../css/component/sharing/social-share-modal.component.scss`,
	],
	template: `
		<div class="social-share-modal" *ngIf="socialUserInfo">
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
				<div class="text">Share on {{ socialUserInfo.network }}</div>
			</div>
			<ng-content select=".share-preview"></ng-content>
			<section class="sharing-body" [ngClass]="{ 'disabled': !buttonEnabled }">
				<share-login
					[socialInfo]="socialUserInfo"
					(onLoginRequest)="handleLoginRequest()"
					(onLogoutRequest)="handleLogoutRequest()"
				></share-login>
				<share-info [loggedIn]="socialUserInfo.id != null" (onShare)="handleShare($event)"> </share-info>
			</section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SocialShareModalComponent {
	@Input() socialUserInfo: SocialUserInfo;
	@Input() buttonEnabled: boolean;

	@Input() closeHandler: () => void;

	@Output() onShare: EventEmitter<string> = new EventEmitter<string>();
	@Output() onLoginRequest: EventEmitter<boolean> = new EventEmitter<boolean>();
	@Output() onLogoutRequest: EventEmitter<boolean> = new EventEmitter<boolean>();

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
