import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';

@Component({
	selector: 'card-tooltip',
	styleUrls: [`../../../css/component/tooltip/card-tooltip.component.scss`],
	template: `
		<div class="card-tooltip">
			<img [src]="image" />
			<div *ngIf="_text" class="text">{{ _text }}</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardTooltipComponent {
	image: string;
	_text: string;

	constructor(private cdr: ChangeDetectorRef) {}

	@Input() set cardId(value: string) {
		this.image = `https://static.zerotoheroes.com/hearthstone/fullcard/en/compressed/${value}.png`;
		// console.log('setting tooltip', value, this.image);
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() set text(value: string) {
		this._text = value;
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}
}
