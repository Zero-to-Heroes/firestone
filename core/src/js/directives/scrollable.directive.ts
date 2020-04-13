import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
	selector: '[scrollable]',
})
export class ScrollableDirective {
	constructor(private elementRef: ElementRef) {}

	@HostListener('mousedown', ['$event'])
	onHistoryClick(event: MouseEvent) {
		const scrollbarWidth = 15;
		const scrollableEl = this.elementRef.nativeElement;
		if (scrollableEl) {
			const rect = scrollableEl.getBoundingClientRect();
			if (event.offsetX >= rect.width - scrollbarWidth) {
				event.stopPropagation();
				return;
			}
		}
	}
}
