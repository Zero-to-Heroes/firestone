import { AfterViewInit, ChangeDetectorRef, Directive, ElementRef, Input, ViewRef } from '@angular/core';

@Directive({
	selector: '[cardElementResize]',
})
export class CardElementResizeDirective implements AfterViewInit {
	@Input() fontSizeRatio: number;
	@Input() timeout = 0;
	@Input() keepOpacity = false;
	@Input() isCardElement = true;

	constructor(private elRef: ElementRef, private cdr: ChangeDetectorRef) {
		document.addEventListener('card-resize', () => this.resizeText(), true);
	}

	ngAfterViewInit() {
		this.elRef.nativeElement.style.opacity = 0;
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
		if (!this.isCardElement) {
			window.addEventListener('resize', () => this.resizeText());
		}
		setTimeout(() => this.resizeText(), this.timeout);
	}

	private resizeText() {
		try {
			const el = this.elRef.nativeElement;
			if (!el) {
				setTimeout(() => this.resizeText());
				return;
			}
			const fontSize = this.fontSizeRatio * el.getBoundingClientRect().width;
			const textEls = this.elRef.nativeElement.querySelectorAll('[resizeTarget]');
			for (const textEl of textEls) {
				textEl.style.fontSize = fontSize + 'px';
				// console.log('resized element', textEl, textEls);
				if (!this.keepOpacity) {
					this.elRef.nativeElement.style.opacity = 1;
				} else {
					this.elRef.nativeElement.style.removeProperty('opacity');
				}
				if (!(this.cdr as ViewRef).destroyed) {
					this.cdr.detectChanges();
				}
			}
		} catch (e) {
			console.error('[card-element-resize] Exception in resizeText', e);
		}
	}
}
