import { Component, Input, HostBinding, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, ViewRef } from '@angular/core';
import { ViewContainerRef, ViewChild, ReflectiveInjector, ComponentFactoryResolver, ViewEncapsulation } from '@angular/core';

import { Events } from '../services/events.service';

declare var overwolf: any;


@Component({
  	selector: 'tooltip',
	styleUrls: [`../../css/component/tooltip.component.scss`],
	encapsulation: ViewEncapsulation.None,
	template: `<img src={{image()}} *ngIf="cardId" [ngClass]="{'missing': missing, 'removing': removing}"/>`,
	// I don't know how to make this work with OnPush
	// changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Tooltip {

	@Input() cardId: string;
	@Input() missing: boolean;
	@Input() removing: boolean;

	@HostBinding('style.left') left: string;
	@HostBinding('style.top') top: string;
	@HostBinding('style.position') position: string;
	@HostBinding('style.display') display: string;

	image() {
		return `http://static.zerotoheroes.com/hearthstone/fullcard/en/256/${this.cardId}.png`;
	}
}

@Component({
	selector: 'tooltips',
	styleUrls: [`../../css/component/tooltips.component.scss`],
	entryComponents: [Tooltip],
	encapsulation: ViewEncapsulation.None,
	template: `
		<div class="tooltips"><ng-template #tooltips></ng-template></div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TooltipsComponent implements AfterViewInit {

    @ViewChild('tooltips', { read: ViewContainerRef }) tooltips: ViewContainerRef;
    private tooltip;

	constructor(
		private events: Events,
		private cdr: ChangeDetectorRef,
		private resolver: ComponentFactoryResolver) {

		this.events.on(Events.SHOW_TOOLTIP).subscribe(
			(data) => {
				// let start = Date.now();
				this.destroy();

				let cardId: string = data.data[0];
				let x: number = data.data[1];
				let y: number = data.data[2];
				let owned: boolean = data.data[3];
				let top: number = Math.min(window.innerHeight - 400, y - 388 / 2);
				if (x > 500) {
					// Tooltip width and offset
					x = x - 256 - 70;
				}

			    this.tooltip.instance.display = 'block';
		    	this.tooltip.instance.removing = false;
			    this.tooltip.instance.cardId = cardId;
			    this.tooltip.instance.left = x + 'px';
			    this.tooltip.instance.top = top + 'px';
			    this.tooltip.instance.position = 'absolute';
			    this.tooltip.instance.missing = !owned;
				if (!(<ViewRef>this.cdr).destroyed) {
					this.cdr.detectChanges();
				}
			    // console.log('Created tooltip after', (Date.now() - start));
			}
		);

		this.events.on(Events.HIDE_TOOLTIP).subscribe(
			(data) => {
				// console.log('hiding tooltip', data);
				this.destroy();
			}
		);
	}

	ngAfterViewInit() {
		this.cdr.detach();
		// https://blog.angularindepth.com/everything-you-need-to-know-about-the-expressionchangedafterithasbeencheckederror-error-e3fd9ce7dbb4
		setTimeout(() => {
		    // We create a factory out of the component we want to create
		    let factory = this.resolver.resolveComponentFactory(Tooltip);

		    // We create the component using the factory and the injector
		    this.tooltip = this.tooltips.createComponent(factory);
		})
	}

	private destroy() {
		if (this.tooltip) {
			this.tooltip.instance.removing = true;
			this.tooltip.instance.display = 'none';
			if (!(<ViewRef>this.cdr).destroyed) {
				this.cdr.detectChanges();
			}
		}
	}
}
