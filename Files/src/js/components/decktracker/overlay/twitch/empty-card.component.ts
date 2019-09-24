import { ChangeDetectionStrategy, Component, ElementRef, HostListener, Input } from '@angular/core';
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
			<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" />
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyCardComponent {
	_cardId: string;

	@Input('cardId') set cardId(value: string) {
		this._cardId = value;
		const imageUrl = `https://static.zerotoheroes.com/hearthstone/fullcard/en/compressed/${this.cardId}.png`;
		const image = new Image();
		image.onload = () => console.log('[image-preloader] preloaded image', imageUrl);
		image.src = imageUrl;
	}

	constructor(private el: ElementRef, private events: Events) {}

	@HostListener('mouseenter') onMouseEnter() {
		const rect = this.el.nativeElement.getBoundingClientRect();
		// console.log('on mouse enter', this.cardId, rect);
		this.events.broadcast(Events.DECK_SHOW_TOOLTIP, this._cardId, rect.left, rect.top, true, rect);
	}

	@HostListener('mouseleave')
	onMouseLeave() {
		this.events.broadcast(Events.DECK_HIDE_TOOLTIP);
	}
}
