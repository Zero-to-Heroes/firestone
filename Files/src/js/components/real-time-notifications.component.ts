import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ViewEncapsulation,
	ViewRef,
} from '@angular/core';
import { RealTimeNotificationService } from '../services/real-time-notifications.service';

@Component({
	selector: 'real-time-notifications',
	styleUrls: [
		`../../css/global/components-global.scss`,
		`../../css/component/real-time-notifications.component.scss`,
	],
	template: `
		<div class="real-time-notifications {{ notifications[currentNotificationIndex].type }}" *ngIf="notifications">
			<i class="i-30 error-theme warning-icon">
				<svg class="svg-icon-fill">
					<use xlink:href="/Files/assets/svg/sprite.svg#error" />
				</svg>
			</i>
			<span [innerHtml]="notifications[currentNotificationIndex].text"></span>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None,
})
export class RealTimeNotificationsComponent implements AfterViewInit {
	currentNotificationIndex = 0;
	notifications: any[];

	constructor(private notificationService: RealTimeNotificationService, private cdr: ChangeDetectorRef) {}

	async ngAfterViewInit() {
		this.cdr.detach();
		await this.getNotifications();
	}

	private async getNotifications() {
		this.notifications = await this.notificationService.getStatus();
		if (this.notifications) {
			this.currentNotificationIndex = (this.currentNotificationIndex + 1) % this.notifications.length;
		}
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}
}
