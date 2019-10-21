import { Overlay, OverlayPositionBuilder, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { ComponentRef, Directive, ElementRef, HostListener, Input, OnInit } from '@angular/core';
import { HelpTooltipComponent } from '../components/tooltip/help-tooltip.component';

@Directive({
	selector: '[helpTooltip]',
})
// See https://blog.angularindepth.com/building-tooltips-for-angular-3cdaac16d138
export class HelpTooltipDirective implements OnInit {
	@Input('helpTooltip') text = '';
	@Input('helpTooltipPosition') position: 'bottom' | 'right' = 'bottom';

	private tooltipPortal;
	private overlayRef: OverlayRef;

	constructor(
		private overlayPositionBuilder: OverlayPositionBuilder,
		private elementRef: ElementRef,
		private overlay: Overlay,
	) {}

	ngOnInit() {
		console.log('targeting tooltip help element', this.position);
		const target = this.elementRef.nativeElement.querySelector('[helpTooltipTarget]') || this.elementRef;

		const positionStrategy =
			this.position === 'bottom'
				? this.overlayPositionBuilder
						// Create position attached to the elementRef
						.flexibleConnectedTo(target)
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
						])
				: this.overlayPositionBuilder
						// Create position attached to the elementRef
						.flexibleConnectedTo(target)
						.withPositions([
							{
								originX: 'end',
								originY: 'center',
								overlayX: 'start',
								overlayY: 'center',
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
		this.overlayRef.detach();
	}
}
