import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, ViewRef } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
	selector: 'help-tooltip',
	styleUrls: [`../../../css/component/tooltip/help-tooltip.component.scss`],
	template: `
		<div class="help-tooltip">
			<div class="text" [innerHTML]="_text"></div>
			<svg
				class="tooltip-arrow"
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 16 9"
				[style.top.px]="arrowTop"
				[style.left.px]="arrowLeft"
				[style.transform]="arrowTransform"
			>
				<polygon points="0,9 8,0 16,9" />
			</svg>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelpTooltipComponent {
	_text: SafeHtml;

	arrowTop: number;
	arrowLeft: number;
	arrowTransform: string;

	// private rect;
	private arrowElement;
	private element;

	constructor(private cdr: ChangeDetectorRef, private sanitizer: DomSanitizer, private elRef: ElementRef) {}

	@Input() set text(value: string) {
		this._text = this.sanitizer.bypassSecurityTrustHtml(`<div>${value}</div>`);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	public setTarget(target: ElementRef) {
		setTimeout(() => {
			this.arrowElement = this.elRef.nativeElement.querySelector('.tooltip-arrow');
			this.element = this.elRef.nativeElement.querySelector('.help-tooltip');
			const thisPosition = getPosition(this.element);
			const targetPosition = getPosition(target.nativeElement);
			const arrowRect = this.arrowElement.getBoundingClientRect();
			const thisRect = this.element.getBoundingClientRect();
			const targetRect = target.nativeElement.getBoundingClientRect();
			this.arrowTop = targetPosition.offsetTop > thisPosition.offsetTop ? thisRect.height : -arrowRect.height;
			this.arrowTransform = targetPosition.offsetTop < thisPosition.offsetTop ? '' : 'rotate(180deg)';
			this.arrowLeft = Math.max(
				0,
				targetPosition.offsetLeft - thisPosition.offsetLeft + (targetRect.width - arrowRect.width) / 2,
			);
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		});
	}
}

const getPosition = (el) => {
	let offsetLeft = 0;
	let offsetTop = 0;

	while (el) {
		offsetLeft += el.offsetLeft;
		offsetTop += el.offsetTop;
		el = el.offsetParent;
	}
	return { offsetTop: offsetTop, offsetLeft: offsetLeft };
};
