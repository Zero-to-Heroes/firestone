import { Directive, ElementRef, HostListener, Input, OnInit, ComponentRef } from '@angular/core';
import { OverlayRef, Overlay, OverlayPositionBuilder } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { CardTooltipComponent } from '../components/tooltip/card-tooltip.component';

@Directive({
	selector: '[cardTooltip]',
})
// See https://blog.angularindepth.com/building-tooltips-for-angular-3cdaac16d138
export class CardTooltipDirective implements OnInit {
	@Input('cardTooltip') cardId = '';

	private tooltipPortal;
	private overlayRef: OverlayRef;

	constructor(private overlayPositionBuilder: OverlayPositionBuilder, private elementRef: ElementRef, private overlay: Overlay) {}

	ngOnInit() {
		const positionStrategy = this.overlayPositionBuilder
			// Create position attached to the elementRef
			.flexibleConnectedTo(this.elementRef)
			// Describe how to connect overlay to the elementRef
			.withPositions([
				{
					originX: 'end',
					originY: 'center',
					overlayX: 'start',
					overlayY: 'center',
				},
			])
			.withPositions([
				{
					originX: 'start',
					originY: 'center',
					overlayX: 'end',
					overlayY: 'center',
				},
			]);
		// Connect position strategy
		this.overlayRef = this.overlay.create({ positionStrategy });
	}

	@HostListener('mouseenter')
	onMouseEnter() {
		// Create tooltip portal
		this.tooltipPortal = new ComponentPortal(CardTooltipComponent);

		// Attach tooltip portal to overlay
		const tooltipRef: ComponentRef<CardTooltipComponent> = this.overlayRef.attach(this.tooltipPortal);

		// Pass content to tooltip component instance
		tooltipRef.instance.cardId = this.cardId;
	}

	@HostListener('mouseleave')
	onMouseLeave() {
		this.overlayRef.detach();
	}
}
