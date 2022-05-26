import { Directive, ElementRef, Input, OnInit } from '@angular/core';

@Directive({
	selector: '[autofocus]',
})
export class AutofocusDirective implements OnInit {
	private focus = true;

	constructor(private el: ElementRef) {}

	ngOnInit() {
		console.debug('on init', this.focus);
		if (this.focus) {
			//Otherwise Angular throws error: Expression has changed after it was checked.
			window.setTimeout(() => {
				this.el.nativeElement.focus(); //For SSR (server side rendering) this is not safe. Use: https://github.com/angular/angular/issues/15008#issuecomment-285141070)
				console.debug('focusing', this.el.nativeElement);
			});
		}
	}

	@Input() set autofocus(condition: boolean) {
		console.debug('set autofocus', condition);
		this.focus = condition !== false;
	}
}
