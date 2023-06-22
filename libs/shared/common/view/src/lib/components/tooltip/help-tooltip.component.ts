import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, ViewRef } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
	selector: 'help-tooltip',
	styleUrls: [`./help-tooltip.component.scss`],
	template: `
		<div class="help-tooltip {{ _classes }}">
			<div class="text" [innerHTML]="_text" [style.maxWidth.px]="_width"></div>
			<svg
				class="tooltip-arrow"
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 16 9"
				[style.top.px]="arrowTop"
				[style.left.px]="arrowLeft"
				[style.transform]="arrowTransform"
				*ngIf="_showArrow"
			>
				<polygon points="0,9 8,0 16,9" />
			</svg>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelpTooltipComponent {
	@Input() set text(value: string) {
		this._text = this.sanitizer.bypassSecurityTrustHtml(`<div>${value}</div>`);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() set showArrow(value: boolean) {
		this._showArrow = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() set classes(value: string) {
		this._classes = value ?? '';
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() set width(value: number) {
		this._width = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	_text: SafeHtml;
	_showArrow = false;
	_classes: string;
	_width = 200;

	arrowTop: number;
	arrowLeft: number;
	arrowTransform: string;

	// private rect;
	private arrowElement;
	private element;

	constructor(private cdr: ChangeDetectorRef, private sanitizer: DomSanitizer, private elRef: ElementRef) {}

	public setTarget(target: ElementRef) {
		if (!this._showArrow) {
			return;
		}

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
