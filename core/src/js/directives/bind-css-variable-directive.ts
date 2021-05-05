import { Directive, ElementRef, Input, OnChanges } from '@angular/core';

@Directive({ selector: '[bindCssVariable]' })
export class BindCssVariableDirective implements OnChanges {
	@Input('bindCssVariable') variable: string;
	@Input('bindCssVariableValue') value: string;

	constructor(private host: ElementRef<HTMLElement>) {}

	ngOnChanges(changes) {
		const value = changes.value.currentValue;
		this.host.nativeElement.style.setProperty(`--${this.variable}`, value);
	}
}
