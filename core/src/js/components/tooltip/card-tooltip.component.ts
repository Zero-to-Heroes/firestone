import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';

@Component({
	selector: 'card-tooltip',
	styleUrls: [`../../../css/component/tooltip/card-tooltip.component.scss`],
	template: `
		<div class="card-tooltip {{ _additionalClass }}">
			<img [src]="image" (onload)="refresh()" />
			<div *ngIf="_text" class="text">{{ _text }}</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardTooltipComponent {
	image: string;
	_text: string;
	_additionalClass: string;

	@Input() set additionalClass(value: string) {
		this._additionalClass = value;
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

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

	constructor(private cdr: ChangeDetectorRef) {}

	refresh() {
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}
}
