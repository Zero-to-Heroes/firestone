import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DeckState } from '../../../models/decktracker/deck-state';

@Component({
	selector: 'decktracker-title-bar',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		'../../../../css/component/decktracker/overlay/decktracker-title-bar.component.scss',
	],
	template: `
		<div class="title-bar">
			<decktracker-deck-name [hero]="deck?.hero" [deckName]="deck?.name"></decktracker-deck-name>
			<decktracker-cards-recap [deck]="deck"></decktracker-cards-recap>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckTrackerTitleBarComponent {
	@Input() deck: DeckState;

	constructor() {
		console.log('building title bar');
	}

	ngAfterViewInit() {
		console.log('build title bar');
	}
}
