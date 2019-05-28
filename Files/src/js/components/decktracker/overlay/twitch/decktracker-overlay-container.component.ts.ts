import { Component, ChangeDetectionStrategy, ElementRef, Renderer2, ChangeDetectorRef } from '@angular/core';

@Component({
	selector: 'decktracker-overlay-container',
	styleUrls: [
		'../../../../../css/global/components-global.scss',
		'../../../../../css/component/decktracker/overlay/twitch/decktracker-overlay-container.component.scss',
		'../../../../../css/component/decktracker/overlay/twitch/decktracker-overlay-container-dev.component.scss',
	],
	template: `
        <div class="container drag-boundary">
		    <decktracker-overlay-standalone></decktracker-overlay-standalone>
        </div>
    `,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckTrackerOverlayContainerComponent {
}