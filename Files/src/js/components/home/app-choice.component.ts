import { Component, NgZone, OnInit } from '@angular/core';

declare var overwolf: any;

@Component({
	selector: 'app-choice',
	styleUrls: [`../../../css/component/home/app-choice.component.scss`],
	template: `
		<div class="app-choice">
			<div class="app binder">
				<span class="title">The Binder</span>
				<span class="sub-title">Deep dive into your card collection</span>
			</div>
			<div class="app chronicler">
				<span class="title">Chronicler</span>
				<span class="sub-title">Celebrate your in-game triumphs</span>
			</div>
			<div class="app deck-tracker">
				<span class="title">Deck Tracker</span>
				<span class="sub-title">Build the best decks and track your stats</span>
			</div>
		</div>
	`,
})

export class AppChoiceComponent implements OnInit {

	private version;

	constructor(private ngZone: NgZone) {

	}

	ngOnInit() {
	}
}
