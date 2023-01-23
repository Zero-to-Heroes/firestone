import { AfterViewInit, ChangeDetectorRef, Directive, ElementRef, HostListener, ViewRef } from '@angular/core';

@Directive({
	selector: '[cardResize]',
})
export class CardResizeDirective implements AfterViewInit {
	constructor(private el: ElementRef, private cdr: ChangeDetectorRef) {}

	ngAfterViewInit() {
		// We use opacity to avoid flickering
		this.el.nativeElement.style.opacity = 0;
		setTimeout(() => this.resize());
	}

	@HostListener('window:resize', ['$event'])
	onResize(event) {
		this.resize();
	}

	private resize() {
		try {
			const el = this.el.nativeElement;
			const width = (120.0 / 187) * el.getBoundingClientRect().height;
			const textEl = this.el.nativeElement;
			textEl.style.width = width + 'px';
			if (!(this.cdr as ViewRef).destroyed) {
				this.cdr.detectChanges();
			}
			setTimeout(() => {
				el && el.dispatchEvent(new Event('card-resize', { bubbles: false }));
				setTimeout(() => {
					this.el.nativeElement.style.opacity = 1;
					if (!(this.cdr as ViewRef).destroyed) {
						this.cdr.detectChanges();
					}
				});
			});
		} catch (e) {
			console.error('[card-resize] Exception in resize', e);
		}
	}
}
