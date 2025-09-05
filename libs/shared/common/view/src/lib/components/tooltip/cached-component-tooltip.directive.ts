/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @angular-eslint/no-input-rename */
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
	standalone: false,
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

	@Input('componentTooltipPosition') position: TooltipPositionType;

	@Input('componentTooltipForceHide') set hideTooltip(value: boolean) {
		this.forceHide = value;
		if (this.forceHide) {
			this.onMouseLeave();
		}
	}

	private tooltipPortal;
	private overlayRef: OverlayRef;
	private positionStrategy: PositionStrategy | null;

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

		this.destroyOverlay();

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
		if (this.overlayRef) {
			const overlayElement = this.overlayRef.overlayElement;
			overlayElement.setAttribute('data-tooltip-source', this.constructor.name);
			overlayElement.setAttribute('data-created-at', new Date().toISOString());
			overlayElement.setAttribute('data-element-id', this.elementRef.nativeElement.id || 'no-id');
			overlayElement.setAttribute('data-element-class', this.elementRef.nativeElement.className || 'no-class');
		}

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		this.destroyOverlay();
	}

	private tooltipRef: ComponentRef<any> | null;

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
			if (!this.overlayRef) {
				return;
			}
			// Create tooltip portal
			this.tooltipPortal = new ComponentPortal(this._componentType);

			// Attach tooltip portal to overlay
			this.tooltipRef = this.overlayRef.attach(this.tooltipPortal)!;

			// Pass content to tooltip component instance
			this.tooltipRef!.instance.config = this._componentInput;
			this.tooltipRef!.instance.cssClass = this.cssClass;
		}
		this.tooltipRef!.instance.visible = true;
		this.positionStrategy?.apply();

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

	// This causes performance issues on Chrome, even with an empty method. So let's ditch it for now
	// @HostListener('window:mousewheel')
	// onScroll() {
	// 	if (!this.tooltipRef?.instance) {
	// 		return;
	// 	}

	// 	this.tooltipRef.instance.visible = false;
	// 	// if (!(this.cdr as ViewRef)?.destroyed) {
	// 	// 	this.cdr.detectChanges();
	// 	// }
	// }

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

	private destroyOverlay(): void {
		// Clean up tooltip reference
		this.tooltipRef = null;

		// Clean up overlay
		if (this.overlayRef) {
			try {
				if (this.overlayRef.hasAttached()) {
					this.overlayRef.detach();
				}
				this.overlayRef.dispose();
			} catch (error) {
				console.warn('Error disposing overlay:', error);
			}
			this.overlayRef = null;
		}

		// Clean up position strategy
		if (this.positionStrategy) {
			try {
				this.positionStrategy.detach?.();
				this.positionStrategy.dispose?.();
			} catch (error) {
				console.warn('Error disposing position strategy:', error);
			}
			this.positionStrategy = null;
		}
	}
}

export type TooltipPositionType = 'bottom' | 'right' | 'left' | 'top' | 'fixed-top-center' | 'auto' | 'right';
