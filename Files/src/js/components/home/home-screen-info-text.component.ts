import { Component, NgZone, OnInit, ViewEncapsulation } from '@angular/core';

import { RealTimeNotificationService } from '../../services/real-time-notifications.service';


const HEARTHSTONE_GAME_ID = 9898;

declare var overwolf: any;

@Component({
	selector: 'home-screen-info-text',
	styleUrls: [`../../../css/component/home/home-screen-info-text.component.scss`],
	encapsulation: ViewEncapsulation.None,
	template: `
		<div class="home-screen-info">
			<div class="hearthlore">
				<i class="i-35 gold-theme left" *ngIf="!importantAnnouncement">
					<svg class="svg-icon-fill">
						<use xlink:href="/Files/assets/svg/sprite.svg#title_decor"/>
					</svg>
				</i>
				<span class="title">{{importantAnnouncement ? 'Update ' : 'Welcome to Hearthlore'}}</span>
				<i class="i-35 gold-theme right" *ngIf="!importantAnnouncement">
					<svg class="svg-icon-fill">
						<use xlink:href="/Files/assets/svg/sprite.svg#title_decor"/>
					</svg>
				</i>
			</div>
			<span class="sub-title" [innerHTML]="status"></span>
		</div>
	`,
})

export class HomeScreenInfoTextComponent implements OnInit {

	private currentNotificationIndex = 0;
	private notifications: any[];
	private importantAnnouncement;

	private status;

	constructor(private notificationService: RealTimeNotificationService) {
		setTimeout(() => this.refresh(), 1000);
	}

	ngOnInit() {
		overwolf.games.getRunningGameInfo((res: any) => {
			console.log('detecting running game in welcome window', res);
			if (res && res.isRunning && res.id && Math.floor(res.id / 10) === HEARTHSTONE_GAME_ID) {
				this.status = "Hearthlore now follows your Hearthtsone session. <br /> Choose an ability:";
			}
			else {
				this.status = "No Hearthstone session detected.<br /> Choose an ability:";
			}
		});
	}

	private refresh() {
		this.notifications = this.notificationService.notifications;
		if (this.notifications) {
			for (let i = 0; i < this.notifications.length; i++) {
				let currentNotif = this.notifications[this.currentNotificationIndex];
				console.log('current notif', currentNotif);
				if (currentNotif.important) {
					this.importantAnnouncement = currentNotif.text;
					this.status = this.importantAnnouncement;
				}
			}
		}
	}
}
