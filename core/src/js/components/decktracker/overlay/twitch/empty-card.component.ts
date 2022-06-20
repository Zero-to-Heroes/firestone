import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';

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
			[cardTooltipBgs]="_cardTooltipBgs"
			[style.transform]="_transform"
			[style.left.%]="_leftOFfset"
			[style.top.%]="_topOffset"
		></div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyCardComponent {
	@Input() set leftOffset(value: number) {
		this._leftOFfset = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() set topOffset(value: number) {
		this._topOffset = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() set transform(value: string) {
		this._transform = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() set cardTooltipBgs(value: boolean) {
		this._cardTooltipBgs = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() set cardId(value: string) {
		this._cardId = value;
		// const imageUrl = `https://static.firestoneapp.com/cards/enUS/512/${value}.png`;
		// // Preload
		// const image = new Image();
		// image.onload = () => console.debug('[image-preloader] preloaded image', imageUrl);
		// image.src = imageUrl;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	_cardId: string;
	_leftOFfset: number;
	_topOffset: number;
	_transform: string;
	_cardTooltipBgs: boolean;

	constructor(private readonly cdr: ChangeDetectorRef) {}
}
