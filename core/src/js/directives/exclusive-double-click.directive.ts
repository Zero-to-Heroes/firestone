import { AfterViewInit, Directive, ElementRef, EventEmitter, Output } from '@angular/core';
import { fromEvent, merge } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

/// Doesn't send a click event when a double click happens
@Directive({
	selector: '[exDoubleClick]',
})
export class DoubleClickDirective implements AfterViewInit {
	@Output() exDoubleClick = new EventEmitter<MouseEvent>();
	@Output() exClick = new EventEmitter<MouseEvent>();

	constructor(private readonly el: ElementRef) {}

	ngAfterViewInit() {
		const el = this.el.nativeElement;
		const clickEvent = fromEvent<MouseEvent>(el, 'click');
		const dblClickEvent = fromEvent<MouseEvent>(el, 'dblclick');
		const eventsMerged = merge(clickEvent, dblClickEvent).pipe(debounceTime(300));
		eventsMerged.subscribe((event) => {
			console.debug('handling event', event);
			if (event.type === 'click') {
				this.exClick.next(event);
			} else {
				this.exDoubleClick.next(event);
			}
		});
	}
}
