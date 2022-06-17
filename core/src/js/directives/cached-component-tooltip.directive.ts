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
		if (value && value !== this._componentType) {
			this.updatePositionStrategy();
		}
	}

	@Input() set componentInput(value: any) {
		this._componentInput = value;
		if (value && value !== this._componentInput) {
			this.updatePositionStrategy();
		}
	}

	@Input('componentTooltipCssClass') cssClass: string;

	@Input('componentTooltipPosition') position: 'bottom' | 'right' | 'left' | 'top' | 'fixed-top-center' | 'auto' =
		'right';

	@Input('componentTooltipForceHide') set hideTooltip(value: boolean) {
		this.forceHide = value;
		if (this.forceHide) {
			this.onMouseLeave();
		}
	}

	private tooltipPortal;
	private overlayRef: OverlayRef;
	private positionStrategy: PositionStrategy;

	private positionDirty = true;
	private forceHide: boolean;

	constructor(
		private overlayPositionBuilder: OverlayPositionBuilder,
		private elementRef: ElementRef,
		private overlay: Overlay,
		private cdr: ChangeDetectorRef,
	) {}

	ngAfterViewInit() {
		this.viewInit = true;
	}

	private updatePositionStrategy() {
		if (!this.viewInit || !this._componentInput || !this._componentType) {
			console.warn('not ready yet', this.viewInit, this._componentInput, this._componentType);
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

		if (this.position === 'fixed-top-center') {
			this.positionStrategy = this.overlayPositionBuilder.global().centerHorizontally().top('2vh');
		} else {
			const positions: ConnectedPosition[] = this.buildPositions();
			this.positionStrategy = this.overlayPositionBuilder
				// Create position attached to the elementRef
				.flexibleConnectedTo(this.elementRef)
				// Describe how to connect overlay to the elementRef
				.withPositions(positions);
		}

		// Connect position strategy
		this.overlayRef = this.overlay.create({ positionStrategy: this.positionStrategy });

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		this.tooltipRef = null;
		if (this.overlayRef) {
			this.overlayRef.detach();
		}
	}

	private tooltipRef: ComponentRef<any>;

	@HostListener('mouseenter')
	onMouseEnter() {
		if (this.forceHide) {
			return;
		}
		if (this.positionDirty) {
			this.updatePositionStrategy();
			this.positionDirty = false;
		}
		if (!this.tooltipRef) {
			// Create tooltip portal
			this.tooltipPortal = new ComponentPortal(this._componentType);

			// Attach tooltip portal to overlay
			this.tooltipRef = this.overlayRef.attach(this.tooltipPortal);

			// Pass content to tooltip component instance
			this.tooltipRef.instance.config = this._componentInput;
			this.tooltipRef.instance.cssClass = this.cssClass;
			console.debug('setting css class', this.cssClass, this.tooltipRef.instance);
		}
		this.tooltipRef.instance.visible = true;
		this.positionStrategy.apply();

		// if (!(this.cdr as ViewRef)?.destroyed) {
		// 	this.cdr.detectChanges();
		// }
	}

	@HostListener('mouseleave')
	onMouseLeave() {
		if (!this.tooltipRef?.instance) {
			return;
		}

		this.tooltipRef.instance.visible = false;
		// if (!(this.cdr as ViewRef)?.destroyed) {
		// 	this.cdr.detectChanges();
		// }
	}

	@HostListener('window:mousewheel')
	onScroll() {
		if (!this.tooltipRef?.instance) {
			return;
		}

		this.tooltipRef.instance.visible = false;
		// if (!(this.cdr as ViewRef)?.destroyed) {
		// 	this.cdr.detectChanges();
		// }
	}

	private buildPositions(): ConnectedPosition[] {
		switch (this.position) {
			case 'left':
				return [
					{
						originX: 'start',
						originY: 'center',
						overlayX: 'end',
						overlayY: 'center',
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
			case 'top':
				return [
					{
						originX: 'center',
						originY: 'top',
						overlayX: 'center',
						overlayY: 'bottom',
					},
				];
			case 'right':
				return [
					{
						originX: 'end',
						originY: 'center',
						overlayX: 'start',
						overlayY: 'center',
					},
				];
			case 'auto':
			default:
				return [
					{
						originX: 'start',
						originY: 'center',
						overlayX: 'end',
						overlayY: 'center',
					},
					{
						originX: 'end',
						originY: 'center',
						overlayX: 'start',
						overlayY: 'center',
					},
				];
		}
	}
}
