import { Component, HostListener } from '@angular/core';

import { Events } from '../services/events.service';

declare var overwolf: any;

@Component({
	selector: 'menu-selection',
	styleUrls: [
		`../../css/component/menu-selection.component.scss`,
		`../../css/global/menu.scss`,
	],
	template: `
		<ul class="menu-selection">
			<li class="selected">The Binder</li>
			<li class="disabled">Achievements</li>
			<li class="disabled">Deck Tracker</li>
		</ul>
	`,
})

export class MenuSelectionComponent {

	constructor(private events: Events) {

	}
}
