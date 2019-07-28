import { Component, Input, HostBinding, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, ViewRef, ElementRef } from '@angular/core';
import { ViewContainerRef, ViewChild, ComponentFactoryResolver, ViewEncapsulation } from '@angular/core';
import { trigger, state, transition, style, animate } from '@angular/animations';

import { Events } from '../services/events.service';

@Component({
  	selector: 'tooltip',
	styleUrls: [`../../css/component/tooltip.component.scss`],
	encapsulation: ViewEncapsulation.None,
	template: `
	<div class="tooltip-container" [ngClass]="{'missing': missing}">
		<img src="/Files/assets/images/placeholder.png" class="placeholder" [@showPlaceholder]="showPlaceholder" />
		<img src={{image()}} *ngIf="cardId" (load)="imageLoadedHandler()" [@showRealCard]="!showPlaceholder" [ngClass]="{'removing': removing}"/>
		<div class="overlay" [ngStyle]="{'-webkit-mask-image': overlayMaskImage()}"></div>
	</div>`,
	animations: [
		trigger('showPlaceholder', [
			state('false',	style({
				opacity: 0,
				"pointer-events": "none",
			})),
			state('true',	style({
				opacity: 1,
			})),
			transition(
				'true => false',
				animate(`150ms linear`)),
		]), 
		trigger('showRealCard', [
			state('false',	style({
				opacity: 0,
				"pointer-events": "none",
			})),
			state('true',	style({
				opacity: 1,
			})),
			transition(
				'false => true',
				animate(`150ms linear`)),
		])
	]
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

	showPlaceholder: boolean = true;

	constructor(private cdr: ChangeDetectorRef) { }

	image() {
		return `https://static.zerotoheroes.com/hearthstone/fullcard/en/compressed/${this.cardId}.png`;
	}
	overlayMaskImage() {
		return `url('https://static.zerotoheroes.com/hearthstone/fullcard/en/compressed/${this.cardId}.png')`;
	}
	imageLoadedHandler() {
		this.showPlaceholder = false;
		if (!(<ViewRef>this.cdr).destroyed) {
			this.cdr.detectChanges();
		}
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

	@Input() module: string;
	@Input() position: string = 'inside';

    @ViewChild('tooltips', { read: ViewContainerRef }) tooltips: ViewContainerRef;
    private tooltip;

	constructor(
		private events: Events,
        private cdr: ChangeDetectorRef,
        private el: ElementRef,
		private resolver: ComponentFactoryResolver) {

		this.events.on(Events.SHOW_TOOLTIP).subscribe(
			(data) => {
				// let start = Date.now();
				this.destroy();

				let cardId: string = data.data[0];
				let left: number = data.data[1];
				let elementTop: number = data.data[2];
                let owned: boolean = data.data[3];
                const elementRect = data.data[4];
				let top: number = Math.min(window.innerHeight - 400, elementTop - 388 / 2);
				// console.log('displaying tooltip', x, y, owned, top);
				
                if (this.position === 'outside') {
                    top = elementRect.top - 275 / 2;
                    const containerHeight = parseInt(window.getComputedStyle(this.el.nativeElement).height.split('px')[0]);
                    // console.log('considering outside positioning', data, containerHeight, top);
                    if (top < 0) {
                        top = 0;
                    }
                    else if (top + 290 > containerHeight) {
                        top = containerHeight - 290;
                    }
                    // else if (top > window.innerHeight - 400) {
                    //     top = window.innerHeight - 400;
                    // }
                    if (elementRect.left < 350) {
                        left = elementRect.right + 12;
                    } 
                    else {
                        left = elementRect.left - 217;
                    }
                }
                // TODO: clean this messy hack (which will probably never happen :p)
				else if (this.module === 'decktracker') {
					// console.log('displaying decktracker tooltip', top, elementRect);
                    // If element is too high, display the tooltip below the mouse
                    if (elementRect.top < 350) {
                        top = elementTop + 15;
                    }
                    // Otherwise display the elemtn sligntly above the mouse
                    else {
                        top = elementTop - 300;
                    }
					left = 0;
				}
				else if (left > 500) {
					// Tooltip width and offset
					left = left - 256 - 70;
				}

				this.tooltip.instance.showPlaceholder = true;
			    this.tooltip.instance.display = 'flex';
		    	this.tooltip.instance.removing = false;
			    this.tooltip.instance.cardId = cardId;
			    this.tooltip.instance.left = left + 'px';
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
