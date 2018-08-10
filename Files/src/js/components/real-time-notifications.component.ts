import { Component, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';

import { Events } from '../services/events.service';
import { RealTimeNotificationService } from '../services/real-time-notifications.service';

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
			<span [innerHtml]="notifications[currentNotificationIndex].text"></span>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})

export class RealTimeNotificationsComponent implements AfterViewInit {

	currentNotificationIndex = 0;
	notifications: any[];

	constructor(private notificationService: RealTimeNotificationService, private cdr: ChangeDetectorRef) {
		setInterval(() => this.refresh(), 15 * 1000);
		setTimeout(() => this.refresh(), 1000);
	}

	ngAfterViewInit() {
		this.cdr.detach();
	}

	private refresh() {
		this.notifications = this.notificationService.notifications;
		if (this.notifications) {
			this.currentNotificationIndex = (this.currentNotificationIndex + 1) % this.notifications.length;
		}
		this.cdr.detectChanges();
	}
}
