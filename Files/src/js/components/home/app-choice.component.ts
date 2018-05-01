import { Component, NgZone, OnInit } from '@angular/core';

declare var overwolf: any;

@Component({
	selector: 'app-choice',
	styleUrls: [
		`../../../css/global/components-global.scss`,
		`../../../css/component/home/app-choice.component.scss`,
	],
	template: `
		<div class="app-choice">
			<div class="app binder">
				<i class="i-150X150 gold-theme">
					<svg class="svg-icon-fill">
						<use xlink:href="/Files/assets/svg/sprite.svg#the_binder"/>
					</svg>
				</i>
				<span class="title">The Binder</span>
				<span class="sub-title">Deep dive into your card collection</span>
				<div class="banner"></div>
			</div>
			<div class="app chronicler">
				<i class="i-150X150 gold-theme">
					<svg class="svg-icon-fill">
						<use xlink:href="/Files/assets/svg/sprite.svg#achievements"/>
					</svg>
				</i>
				<span class="title">Chronicler</span>
				<span class="sub-title">Celebrate your in-game triumphs</span>
				<div class="banner"></div>
			</div>
			<div class="app deck-tracker last">
				<i class="i-150X150 gold-theme">
					<svg class="svg-icon-fill">
						<use xlink:href="/Files/assets/svg/sprite.svg#deck_tracker"/>
					</svg>
				</i>
				<span class="title">Deck Tracker</span>
				<span class="sub-title">Build the best decks and track them!</span>
				<div class="banner"></div>
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
