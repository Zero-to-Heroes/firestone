import { Component, HostListener } from '@angular/core';

import { Events } from '../services/events.service';

declare var overwolf: any;

@Component({
	selector: 'hearthhead',
	styleUrls: [`../../css/component/hearthhead.component.scss`],
	template: `
		<div class="hearthhead">HearthHead</div>
	`,
})

export class HearthheadComponent {

	constructor(private events: Events) {

	}

	@HostListener('click', ['$event'])
	private showLogin(event: MouseEvent) {
		this.events.broadcast(Events.HEARTHHEAD_LOGIN);
	};
}
