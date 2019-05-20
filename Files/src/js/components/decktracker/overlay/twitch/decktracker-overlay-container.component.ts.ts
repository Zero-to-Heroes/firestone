import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
	selector: 'decktracker-overlay-container',
	styleUrls: [
		'../../../../../css/global/components-global.scss',
		'../../../../../css/component/decktracker/overlay/twitch/decktracker-overlay-container.component.scss',
	],
	template: `
        <div class="container">
		    <decktracker-overlay-standalone cdkDrag></decktracker-overlay-standalone>
        </div>
    `,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckTrackerOverlayContainerComponent {
}