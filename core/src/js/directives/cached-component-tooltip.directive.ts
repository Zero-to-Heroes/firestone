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
	selector: '[cachedComponentTooltip] ',
})
// See https://blog.angularindepth.com/building-tooltips-for-angular-3cdaac16d138
export class CachedComponentTooltipDirective implements AfterViewInit, OnDestroy {
	private _componentInput: any;
	private _componentType: ComponentType<any>;
	private viewInit = false;

	@Input() set componentType(value: ComponentType<any>) {
		this._componentType = value;
		// console.log('setting component type', value);
		if (value && value !== this._componentType) {
			this.updatePositionStrategy();
		}
	}

	@Input() set componentInput(value: any) {
		this._componentInput = value;
		// console.log('setting component input', value);
		if (value && value !== this._componentInput) {
			this.updatePositionStrategy();
		}
	}

	@Input('componentTooltipPosition') position: 'bottom' | 'right' | 'left' | 'top' = 'right';

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
		this.viewInit = true;
		this.updatePositionStrategy();
	}

	private updatePositionStrategy() {
		// console.log('updatePositionStrategy', this.viewInit, this._componentInput, this._componentType);
		if (!this.viewInit || !this._componentInput || !this._componentType) {
			return;
		}
		if (this.positionStrategy) {
			this.positionStrategy.detach();
			this.positionStrategy.dispose();
			this.positionStrategy = null;
		}
		if (this.overlayRef) {
			this.overlayRef.detach();
			this.overlayRef.dispose();
		}
		const positions: ConnectedPosition[] = this.buildPositions();
		this.positionStrategy = this.overlayPositionBuilder
			// Create position attached to the elementRef
			.flexibleConnectedTo(this.elementRef)
			// Describe how to connect overlay to the elementRef
			.withPositions(positions);
		// console.log('[card-tooltip] elementRef', this.elementRef, positions, this.position);

		// Connect position strategy
		this.overlayRef = this.overlay.create({ positionStrategy: this.positionStrategy });
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		// console.log('on destroy for component tooltip');
		this.tooltipRef = null;
		if (this.overlayRef) {
			this.overlayRef.detach();
			// if (!(this.cdr as ViewRef)?.destroyed) {
			// 	this.cdr.detectChanges();
			// }
		}
	}

	private tooltipRef: ComponentRef<any>;

	@HostListener('mouseenter')
	onMouseEnter() {
		// console.log('mouseenter', this.overlayRef);

		if (!this.tooltipRef) {
			// Create tooltip portal
			this.tooltipPortal = new ComponentPortal(this._componentType);

			// Attach tooltip portal to overlay
			this.tooltipRef = this.overlayRef.attach(this.tooltipPortal);

			// Pass content to tooltip component instance
			this.tooltipRef.instance.config = this._componentInput;
			// console.log('created tooltipRef', this.tooltipRef);
		}
		this.tooltipRef.instance.visible = true;
		this.positionStrategy.apply();
		// console.log('created tooltip instance', this.tooltipRef);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@HostListener('mouseleave')
	onMouseLeave() {
		this.tooltipRef.instance.visible = false;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private buildPositions(): ConnectedPosition[] {
		switch (this.position) {
			case 'right':
				return [
					{
						originX: 'end',
						originY: 'center',
						overlayX: 'start',
						overlayY: 'center',
					},
				];
			case 'left':
				return [
					{
						originX: 'start',
						originY: 'center',
						overlayX: 'end',
						overlayY: 'center',
					},
				];
			case 'top':
				return [
					{
						originX: 'center',
						originY: 'top',
						overlayX: 'center',
						overlayY: 'bottom',
					},
				];
			case 'bottom':
				return [
					{
						originX: 'center',
						originY: 'bottom',
						overlayX: 'center',
						overlayY: 'top',
					},
				];
		}
	}
}
