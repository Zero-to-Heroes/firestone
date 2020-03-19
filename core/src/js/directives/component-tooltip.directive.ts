import { ConnectedPosition, Overlay, OverlayPositionBuilder, OverlayRef, PositionStrategy } from '@angular/cdk/overlay';
import { ComponentPortal, ComponentType } from '@angular/cdk/portal';
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

@Directive({
	selector: '[componentTooltip]',
})
// See https://blog.angularindepth.com/building-tooltips-for-angular-3cdaac16d138
export class ComponentTooltipDirective implements AfterViewInit, OnDestroy {
	@Input() componentType: ComponentType<any>;
	@Input() componentInput: any;

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
		this.cdr.detach();
		this.updatePositionStrategy();
	}

	private updatePositionStrategy() {
		if (this.positionStrategy) {
			this.positionStrategy.detach();
			this.positionStrategy.dispose();
			this.positionStrategy = null;
		}
		if (this.overlayRef) {
			this.overlayRef.detach();
			this.overlayRef.dispose();
		}
		const positions: ConnectedPosition[] = [
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
		];
		this.positionStrategy = this.overlayPositionBuilder
			// Create position attached to the elementRef
			.flexibleConnectedTo(this.elementRef)
			// Describe how to connect overlay to the elementRef
			.withPositions(positions);
		// console.log('[card-tooltip] elementRef', this.elementRef, positions, this.position);

		// Connect position strategy
		this.overlayRef = this.overlay.create({ positionStrategy: this.positionStrategy });
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	ngOnDestroy() {
		if (this.overlayRef) {
			this.overlayRef.detach();
			if (!(this.cdr as ViewRef).destroyed) {
				this.cdr.detectChanges();
			}
		}
	}

	@HostListener('mouseenter')
	onMouseEnter() {
		// console.log('mouseenter', this._position);
		// Create tooltip portal
		this.tooltipPortal = new ComponentPortal(this.componentType);

		// Attach tooltip portal to overlay
		const tooltipRef: ComponentRef<any> = this.overlayRef.attach(this.tooltipPortal);

		// Pass content to tooltip component instance
		tooltipRef.instance.config = this.componentInput;
		this.positionStrategy.apply();
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	@HostListener('mouseleave')
	onMouseLeave() {
		if (this.overlayRef) {
			this.overlayRef.detach();
			if (!(this.cdr as ViewRef).destroyed) {
				this.cdr.detectChanges();
			}
		}
	}
}
