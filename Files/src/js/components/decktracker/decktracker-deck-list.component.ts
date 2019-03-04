import { Component, ChangeDetectionStrategy, Input, HostListener, ElementRef } from '@angular/core';
import { DeckState } from '../../models/decktracker/deck-state';

@Component({
	selector: 'decktracker-deck-list',
	styleUrls: [
		'../../../css/global/components-global.scss',
		'../../../css/component/decktracker/decktracker-deck-list.component.scss',
		`../../../css/global/scrollbar-decktracker-overlay.scss`,
	],
	template: `
		<div class="deck-list">
			<ng-container [ngSwitch]="_displayMode">
				<deck-list-by-zone *ngSwitchCase="'DISPLAY_MODE_ZONE'" 
					[deckState]="_deckState">
				</deck-list-by-zone>
			</ng-container>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckTrackerDeckListComponent {

	_deckState: DeckState;
	_displayMode: string = 'DISPLAY_MODE_ZONE';

	constructor(private el: ElementRef) { }

	@Input('deckState') set deckState(deckState: DeckState) {
		this._deckState = deckState;
	}

	// Prevent the window from being dragged around if user scrolls with click
	@HostListener('mousedown', ['$event'])
	onHistoryClick(event: MouseEvent) {
		// console.log('handling history click', event);
		let rect = this.el.nativeElement.querySelector('.deck-list').getBoundingClientRect();
		// console.log('element rect', rect);
		let scrollbarWidth = 5;
		if (event.offsetX >= rect.width - scrollbarWidth) {
			event.stopPropagation();
		}
	}

}