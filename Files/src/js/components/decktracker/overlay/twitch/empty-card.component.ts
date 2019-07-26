import { Component, ChangeDetectionStrategy, Input, HostListener, ElementRef } from '@angular/core';
import { Events } from '../../../../services/events.service';

@Component({
	selector: 'empty-card',
	styleUrls: [
		'../../../../../css/global/components-global.scss',
		'../../../../../css/component/decktracker/overlay/twitch/empty-card.component.scss',
	],
	template: `
		<div class="card">
			<!-- transparent image with 1:1 intrinsic aspect ratio -->
			<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7">
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyCardComponent {

	@Input() cardId: string;

	constructor(private el: ElementRef, private events: Events) {

	}

	@HostListener('mouseenter') onMouseEnter() {
		let rect = this.el.nativeElement.getBoundingClientRect();
		console.log('on mouse enter', rect);
		this.events.broadcast(Events.DECK_SHOW_TOOLTIP, this.cardId, rect.left, rect.top, true, rect);
	}

	@HostListener('mouseleave')
	onMouseLeave() {
		this.events.broadcast(Events.DECK_HIDE_TOOLTIP);
	}
}