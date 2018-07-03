import { Component } from '@angular/core';

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
			<li class="selected" (click)="selectModule('collection')">
				<span>The Binder</span>
			</li>
			<li class="disabled" (click)="selectModule('achievements')">
				<span>Achievements</span>
				<div class="zth-tooltip bottom">
					<p>Coming soon</p>
					<svg class="tooltip-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9">
						<polygon points="0,0 8,-9 16,0"/>
					</svg>
				</div>
			</li>
			<li class="disabled">
				<span>Deck Tracker</span>
				<div class="zth-tooltip bottom">
					<p>Coming soon</p>
					<svg class="tooltip-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9">
						<polygon points="0,0 8,-9 16,0"/>
					</svg>
				</div>
			</li>
		</ul>
	`,
})

export class MenuSelectionComponent {

	constructor(private events: Events) {

	}

	private selectModule(module: string) {
		// this.events.broadcast(Events.MODULE_SELECTED, module);
	}
}
