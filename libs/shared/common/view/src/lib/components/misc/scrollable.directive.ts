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
		console.debug('[debug] onHistoryClick', event);
		const scrollbarWidth = 25;
		const scrollableEl = this.elementRef.nativeElement;
		if (scrollableEl) {
			const rect = scrollableEl.getBoundingClientRect();
			const clickX = event.clientX - rect.left;
			console.debug('[debug] clickX', clickX, rect);
			if (clickX >= rect.width - scrollbarWidth) {
				console.debug('[debug] clickX >= rect.width - scrollbarWidth');
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
