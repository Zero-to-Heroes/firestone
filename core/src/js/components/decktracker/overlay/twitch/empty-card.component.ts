import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
	selector: 'empty-card',
	styleUrls: [
		'../../../../../css/global/components-global.scss',
		'../../../../../css/component/decktracker/overlay/twitch/empty-card.component.scss',
	],
	template: `
		<div
			class="card"
			[cardTooltip]="_cardId"
			[cardTooltipPosition]="'right'"
			[style.transform]="transform"
			[style.left.%]="leftOffset"
			[style.top.%]="topOffset"
		>
			<!-- transparent image with 1:1 intrinsic aspect ratio -->
			<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" />
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyCardComponent {
	_cardId: string;
	@Input() leftOffset: number;
	@Input() topOffset: number;
	@Input() transform: string;

	@Input('cardId') set cardId(value: string) {
		this._cardId = value;
		const imageUrl = `https://static.zerotoheroes.com/hearthstone/fullcard/en/compressed/${this.cardId}.png?v=3`;
		// Preload
		const image = new Image();
		image.onload = () => console.debug('[image-preloader] preloaded image', imageUrl);
		image.src = imageUrl;
	}
}
