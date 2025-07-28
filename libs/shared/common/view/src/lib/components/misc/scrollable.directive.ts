import { Directive, ElementRef, EventEmitter, HostListener, Output } from '@angular/core';

@Directive({
	standalone: false,
	selector: '[scrollable]',
})
export class ScrollableDirective {
	@Output() scrolling = new EventEmitter<boolean>();

	constructor(private elementRef: ElementRef) {}

	@HostListener('mousedown', ['$event'])
	onHistoryClick(event: MouseEvent) {
		const scrollbarWidth = 15;
		const scrollableEl = this.elementRef.nativeElement;
		if (scrollableEl) {
			const rect = scrollableEl.getBoundingClientRect();
			if (event.offsetX >= rect.width - scrollbarWidth) {
				event.stopPropagation();
				this.scrolling.next(true);
				return;
			}
		}
	}

	@HostListener('mouseup')
	onHistoryMouseUp() {
		this.scrolling.next(false);
	}
}
