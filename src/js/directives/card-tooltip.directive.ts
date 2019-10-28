import { Overlay, OverlayPositionBuilder, OverlayRef, PositionStrategy } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import {
	AfterViewInit,
	ChangeDetectorRef,
	ComponentRef,
	Directive,
	ElementRef,
	HostListener,
	Input,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { CardTooltipComponent } from '../components/tooltip/card-tooltip.component';

@Directive({
	selector: '[cardTooltip]',
})
// See https://blog.angularindepth.com/building-tooltips-for-angular-3cdaac16d138
export class CardTooltipDirective implements AfterViewInit, OnDestroy {
	@Input('cardTooltip') cardId = '';
	@Input('cardTooltipText') cardTooltipText = undefined;

	private tooltipPortal;
	private overlayRef: OverlayRef;
	private positionStrategy: PositionStrategy;

	constructor(
		private overlayPositionBuilder: OverlayPositionBuilder,
		private elementRef: ElementRef,
		private overlay: Overlay,
		private cdr: ChangeDetectorRef,
	) {}

	ngAfterViewInit() {
		this.positionStrategy = this.overlayPositionBuilder
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
				{
					originX: 'start',
					originY: 'center',
					overlayX: 'end',
					overlayY: 'center',
				},
				{
					originX: 'start',
					originY: 'top',
					overlayX: 'end',
					overlayY: 'top',
				},
				{
					originX: 'end',
					originY: 'top',
					overlayX: 'start',
					overlayY: 'top',
				},
			]);

		// Connect position strategy
		this.overlayRef = this.overlay.create({ positionStrategy: this.positionStrategy });
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	ngOnDestroy() {
		this.overlayRef.detach();
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	@HostListener('mouseenter')
	onMouseEnter() {
		// Create tooltip portal
		this.tooltipPortal = new ComponentPortal(CardTooltipComponent);

		// Attach tooltip portal to overlay
		const tooltipRef: ComponentRef<CardTooltipComponent> = this.overlayRef.attach(this.tooltipPortal);

		// Pass content to tooltip component instance
		tooltipRef.instance.cardId = this.cardId;
		tooltipRef.instance.text = this.cardTooltipText;
		this.positionStrategy.apply();
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	@HostListener('mouseleave')
	onMouseLeave() {
		this.overlayRef.detach();
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}
}
