import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';

@Component({
	standalone: false,
	selector: 'bgs-trinket-strategy-tips-tooltip',
	styleUrls: [`./bgs-trinket-strategy-tips-tooltip.component.scss`],
	template: `
		<div class="tooltip {{ _cssClass }}" [ngClass]="{ hidden: !_visible }">
			<bgs-trinket-strategies-wrapper class="strategies" [cardId]="cardId"></bgs-trinket-strategies-wrapper>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsTrinketStrategyTipsTooltipComponent {
	cardId: string;
	_visible = true;
	_cssClass: string;

	@Input() set cssClass(value: string) {
		this._cssClass = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() set config(value: string) {
		this.cardId = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() set visible(value: boolean) {
		if (value === this._visible) {
			return;
		}
		this._visible = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	constructor(private readonly cdr: ChangeDetectorRef) {}
}
