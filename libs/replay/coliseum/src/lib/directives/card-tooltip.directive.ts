import { Directive, ElementRef, HostListener, Input } from '@angular/core';
import { Entity } from '@firestone-hs/replay-parser';
import { Events } from '../services/events.service';

@Directive({
	selector: '[cardTooltip]',
})
export class CardTooltipDirective {
	@Input() tooltipEntity: Entity;
	@Input() tooltipControllerEntity: Entity | undefined;
	@Input() tooltipEnchantments: readonly Entity[];
	@Input() hasTooltip = true;

	constructor(private el: ElementRef, private events: Events) {}

	@HostListener('mouseenter')
	onMouseEnter() {
		if (!this.hasTooltip || !this.tooltipEntity || !this.tooltipEntity.cardID) {
			return;
		}
		let elementLeft = 0;
		let elementTop = 0;
		let element = this.el.nativeElement;
		while (element && !element.classList.contains('external-player') && !element.classList.contains('coliseum')) {
			// console.log('adding top offset', elementTop, element, element.offsetTop);
			elementLeft += element.offsetLeft;
			elementTop += element.offsetTop;
			element = element.offsetParent;
		}
		// TODO: compute this once at component init + after each resize, instead of every time
		// TODO: move the logic away to tooltips component, so it can take care of auto positioning
		this.events.broadcast(
			Events.SHOW_TOOLTIP,
			this.tooltipEntity,
			this.tooltipControllerEntity,
			elementLeft,
			elementTop,
			this.el.nativeElement.getBoundingClientRect().width,
			this.el.nativeElement.getBoundingClientRect().height,
			this.tooltipEnchantments,
		);
	}

	@HostListener('mouseleave')
	onMouseLeave() {
		this.events.broadcast(Events.HIDE_TOOLTIP, this.tooltipEntity);
	}
}
