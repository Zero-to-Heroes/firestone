import { Component, Input, HostBinding } from '@angular/core';
import { ViewContainerRef, ViewChild, ReflectiveInjector, ComponentFactoryResolver, ViewEncapsulation } from '@angular/core';

import { Events } from '../services/events.service';

import * as Raven from 'raven-js';

declare var overwolf: any;


@Component({
  	selector: 'tooltip',
	styleUrls: [`../../css/component/tooltip.component.scss`],
	encapsulation: ViewEncapsulation.None,
  	template: `<img src={{image()}} *ngIf="cardId" [ngClass]="{'missing': missing, 'removing': removing}"/>`,
  	// template: `Hopla`,
})
export class Tooltip {

	@Input() cardId: string;
	@Input() missing: boolean;
	@Input() removing: boolean;

	@HostBinding('style.left') left: string;
	@HostBinding('style.top') top: string;
	@HostBinding('style.position') position: string;

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
})
export class TooltipsComponent {

    @ViewChild('tooltips', { read: ViewContainerRef }) tooltips: ViewContainerRef;
    private currentTooltip = null;

	constructor(
		private events: Events,
		private resolver: ComponentFactoryResolver) {

		this.events.on(Events.SHOW_TOOLTIP).subscribe(
			(data) => {
				this.destroy();

				// So we're sure the tooltips div is rendered empty before recreating the
				// tooltip, thus applying the transition effect
				setTimeout(() => {
					let cardId: string = data.data[0];
					let x: number = data.data[1];
					let y: number = data.data[2];
					let owned: boolean = data.data[3];
					// console.log('showing tooltip', cardId, x, y, owned, data);

					let top: number = Math.min(window.innerHeight - 400, y - 388 / 2);
					// this.appendComponentToBody(Tooltip);

				    // We create a factory out of the component we want to create
				    let factory = this.resolver.resolveComponentFactory(Tooltip);
				    // console.log('created facctory', factory);

				    // We create the component using the factory and the injector
				    let component = this.tooltips.createComponent(factory);
				    // console.log('created component', component);
				    component.instance.cardId = cardId;
				    component.instance.left = x + 'px';
				    component.instance.top = top + 'px';
				    component.instance.position = 'absolute';
				    component.instance.missing = !owned;
				    // console.log('is card missing?', component.instance.missing);

				    this.currentTooltip = component;
				})
			}
		);

		this.events.on(Events.HIDE_TOOLTIP).subscribe(
			(data) => {
				// console.log('hiding tooltip', data);
				this.destroy();
			}
		);
	}

	private destroy() {
		if (this.currentTooltip) {
			let tooltip = this.currentTooltip;
			this.currentTooltip.instance.removing = true;
			setTimeout(() => {
				// console.log('destroying');
				tooltip.destroy();
				// this.currentTooltip = null;
			}, 100);
		}
	}
}
