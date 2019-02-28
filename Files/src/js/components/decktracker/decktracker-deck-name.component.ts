import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

declare var overwolf: any;

@Component({
	selector: 'decktracker-deck-name',
	styleUrls: [
		'../../../css/global/components-global.scss',
		'../../../css/component/decktracker/decktracker-deck-name.component.scss',
	],
	template: `
		<div class="deck-name">
			{{deckName}}
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckTrackerDeckNameComponent {

	@Input() deckName: string;

}