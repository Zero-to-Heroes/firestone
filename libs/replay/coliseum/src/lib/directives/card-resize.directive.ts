import { AfterViewInit, ChangeDetectorRef, Directive, ElementRef, HostListener, ViewRef } from '@angular/core';

@Directive({
	standalone: false,
	selector: '[cardResize]',
})
// I don't like this approach, as it generates a lot of events and text resizes whenever you mouse over anything
// Resize events should only be sent for the component that appears when mousing over, and whenver
// the window is resized
// See cardElementResize
export class CardResizeDirective implements AfterViewInit {
	constructor(
		private el: ElementRef,
		private cdr: ChangeDetectorRef,
	) {}

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
