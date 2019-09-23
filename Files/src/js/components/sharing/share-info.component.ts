import { Component, Input, ChangeDetectionStrategy, AfterViewInit, EventEmitter } from '@angular/core';

import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';
import { SocialUserInfo } from '../../models/mainwindow/social-user-info';
import { ShareVideoOnSocialNetworkEvent } from '../../services/mainwindow/store/events/social/share-video-on-social-network-event';
import { OverwolfService } from '../../services/overwolf.service';

@Component({
	selector: 'share-info',
	styleUrls: [`../../../css/component/sharing/share-info.component.scss`],
	template: `
		<div class="share-info">
			<textarea [(ngModel)]="textValue" *ngIf="loggedIn"></textarea>
			<div class="login-message" *ngIf="!loggedIn">
				Please use the button on the left to login before posting a message
			</div>
			<button *ngIf="loggedIn" (mousedown)="share()">Share</button>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShareInfoComponent implements AfterViewInit {
	@Input() network: string;
	@Input() videoPathOnDisk: string;
	textValue: string;
	loggedIn: boolean;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private ow: OverwolfService) {}

	@Input() set socialInfo(value: SocialUserInfo) {
		if (!value) {
			return;
		}
		this.loggedIn = value.id != undefined;
	}

	@Input() set achievementName(value: string) {
		this.textValue = `One more #hearthstone #achievement unlocked! | ${value} | Captured by Firestone`;
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	share() {
		this.stateUpdater.next(new ShareVideoOnSocialNetworkEvent(this.network, this.videoPathOnDisk, this.textValue));
	}
}
