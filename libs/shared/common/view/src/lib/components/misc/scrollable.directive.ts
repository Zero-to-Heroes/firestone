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
		const scrollbarSize = 25;
		const scrollableEl = this.elementRef.nativeElement as HTMLElement | undefined;
		if (!scrollableEl) {
			return;
		}

		const rect = scrollableEl.getBoundingClientRect();
		const clickX = event.clientX - rect.left;
		const clickY = event.clientY - rect.top;
		const onVerticalScrollbar = clickX >= rect.width - scrollbarSize;
		const onHorizontalScrollbar = clickY >= rect.height - scrollbarSize;
		if (onVerticalScrollbar || onHorizontalScrollbar) {
			event.stopPropagation();
			this.scrolling.next(true);
		}
	}

	@HostListener('mouseup')
	onHistoryMouseUp() {
		this.scrolling.next(false);
	}
}
