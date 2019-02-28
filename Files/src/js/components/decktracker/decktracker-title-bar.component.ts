import { Component, ChangeDetectionStrategy } from '@angular/core';

declare var overwolf: any;

@Component({
	selector: 'decktracker-title-bar',
	styleUrls: [
		'../../../css/global/components-global.scss',
		'../../../css/component/decktracker/decktracker-title-bar.component.scss',
	],
	template: `
		<div class="title-bar">
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckTrackerTitleBarComponent {

}