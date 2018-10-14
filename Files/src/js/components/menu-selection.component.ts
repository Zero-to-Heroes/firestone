import { Component, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';

import { Events } from '../services/events.service';

@Component({
	selector: 'menu-selection',
	styleUrls: [
		`../../css/global/menu.scss`,
		`../../css/component/menu-selection.component.scss`,
	],
	template: `
		<ul class="menu-selection">
			<li [ngClass]="{'selected': selectedModule == 'collection'}" (click)="selectModule('collection')">
				<span>The Binder</span>
			</li>
			<li [ngClass]="{'selected': selectedModule == 'achievements'}" (click)="selectModule('achievements')">
				<span>Achievements</span>
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
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
})

export class MenuSelectionComponent {

	selectedModule: string = 'collection';

	constructor(private events: Events) {
		this.events.on(Events.MODULE_SELECTED).subscribe((event) => this.selectedModule = event.data[0]);
	}

	selectModule(module: string) {
		this.events.broadcast(Events.MODULE_SELECTED, module);
	}
}
