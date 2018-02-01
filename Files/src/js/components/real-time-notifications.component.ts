import { Component, HostListener } from '@angular/core';

import { Events } from '../services/events.service';

declare var overwolf: any;

@Component({
	selector: 'real-time-notifications',
	styleUrls: [`../../css/component/real-time-notifications.component.scss`],
	template: `
		<div class="real-time-notifications">Fake notification</div>
	`,
})

export class RealTimeNotificationsComponent {

	constructor(private events: Events) {

	}
}
