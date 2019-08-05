import { Directive, ElementRef, HostListener, Input, OnInit, ComponentRef } from '@angular/core';
import { OverlayRef, Overlay, OverlayPositionBuilder } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { HelpTooltipComponent } from '../components/tooltip/help-tooltip.component';

@Directive({
	selector: '[helpTooltip]',
})
// See https://blog.angularindepth.com/building-tooltips-for-angular-3cdaac16d138
export class HelpTooltipDirective implements OnInit {
	@Input('helpTooltip') text = '';

	private tooltipPortal;
	private overlayRef: OverlayRef;

	constructor(private overlayPositionBuilder: OverlayPositionBuilder, private elementRef: ElementRef, private overlay: Overlay) {}

	ngOnInit() {
		const positionStrategy = this.overlayPositionBuilder
			// Create position attached to the elementRef
			.flexibleConnectedTo(this.elementRef)
			// Describe how to connect overlay to the elementRef
			// Means, attach overlay's center bottom point to the
			// top center point of the elementRef.
			.withPositions([
				{
					originX: 'center',
					originY: 'top',
					overlayX: 'center',
					overlayY: 'bottom',
				},
			])
			// Fallback if element is close to the top
			.withPositions([
				{
					originX: 'center',
					originY: 'bottom',
					overlayX: 'center',
					overlayY: 'top',
				},
			]);
		// Connect position strategy
		this.overlayRef = this.overlay.create({ positionStrategy });
	}

	@HostListener('mouseenter')
	onMouseEnter() {
		// Create tooltip portal
		this.tooltipPortal = new ComponentPortal(HelpTooltipComponent);

		// Attach tooltip portal to overlay
		const tooltipRef: ComponentRef<HelpTooltipComponent> = this.overlayRef.attach(this.tooltipPortal);

		// Pass content to tooltip component instance
		tooltipRef.instance.text = this.text;
	}

	@HostListener('mouseleave')
	onMouseLeave() {
		console.log('hiding help tooltip', this.text);
		this.overlayRef.detach();
	}
}
