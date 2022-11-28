import {
	Component,
	ElementRef,
	EventEmitter,
	HostListener,
	Input,
	OnDestroy,
	OnInit,
	Output,
	ViewChild,
} from '@angular/core';

@Component({
	selector: 'infinite-scroll',
	template: `
		<ng-content></ng-content>
		<div #anchor></div>
	`,
})
// https://netbasal.com/build-an-infinite-scroll-component-in-angular-a9c16907a94d
export class InfiniteScrollComponent implements OnInit, OnDestroy {
	@Input() options = {};
	@Output() scrolled = new EventEmitter();
	@ViewChild('anchor', { static: true }) anchor: ElementRef<HTMLElement>;

	private observer: IntersectionObserver;

	constructor(private host: ElementRef) {}

	get element() {
		return this.host.nativeElement;
	}

	ngOnInit() {
		const options = {
			root: this.isHostScrollable() ? this.host.nativeElement : null,
			...this.options,
		};

		this.observer = new IntersectionObserver(([entry]) => {
			entry.isIntersecting && this.scrolled.emit();
		}, options);

		this.observer.observe(this.anchor.nativeElement);
	}

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		this.observer?.disconnect();
	}

	private isHostScrollable() {
		const style = window.getComputedStyle(this.element);

		return style.getPropertyValue('overflow') === 'auto' || style.getPropertyValue('overflow-y') === 'scroll';
	}
}
