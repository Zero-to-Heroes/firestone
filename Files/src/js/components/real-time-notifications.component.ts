import { Component, HostListener } from '@angular/core';
import { Http } from "@angular/http";

import { Events } from '../services/events.service';

declare var overwolf: any;

@Component({
	selector: 'real-time-notifications',
	styleUrls: [
		`../../css/global/components-global.scss`,
		`../../css/component/real-time-notifications.component.scss`,
	],
	template: `
		<div class="real-time-notifications {{notifications[currentNotificationIndex].type}}" *ngIf="notifications">
			<i class="i-30 error-theme warning-icon">
				<svg class="svg-icon-fill">
					<use xlink:href="/Files/assets/svg/sprite.svg#error"/>
				</svg>
			</i>
			<span>{{notifications[currentNotificationIndex].text}}</span>
		</div>
	`,
})

export class RealTimeNotificationsComponent {

	private readonly URL = 'https://iej6sdi74d.execute-api.us-west-2.amazonaws.com/prod/get-status';

	private notifications: string[];
	private currentNotificationIndex = 0;

	constructor(private http: Http) {
		console.log('init real time notifications');

		this.getStatus();
		setInterval(() => {
			this.getStatus();
		}, 60 * 1000)

		setInterval(() => {
			if (this.notifications) {
				this.currentNotificationIndex = (this.currentNotificationIndex + 1) % this.notifications.length;
			}
		}, 15 * 1000)
	}

	private getStatus() {
		console.log('getting status');
		this.http.get(this.URL).subscribe(
			(res: any) => {
				if (res.ok) {
					let status = JSON.parse(res._body);
					this.notifications = status[0].status;
					// console.log('received status', status, this.notifications);
				}
			}
		)
	}
}
