import { ConnectedPosition, Overlay, OverlayPositionBuilder, OverlayRef, PositionStrategy } from '@angular/cdk/overlay';
import { ComponentPortal, ComponentType } from '@angular/cdk/portal';
import {
	AfterViewInit,
	ChangeDetectorRef,
	Directive,
	ElementRef,
	EventEmitter,
	HostListener,
	Input,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { Subscription } from 'rxjs';

@Directive({
	selector: '[componentTooltip]',
})
// See https://blog.angularindepth.com/building-tooltips-for-angular-3cdaac16d138
export class ComponentTooltipDirective implements AfterViewInit, OnDestroy {
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

	@Input() componentTooltipBackdropClass: string;

	@Input('componentTooltipPosition') set position(
		value:
			| 'bottom'
			| 'right'
			| 'left'
			| 'top'
			| 'auto'
			| 'global-top-center'
			| 'global-top-left'
			| 'global-bottom-left',
	) {
		if (value === this._position) {
			return;
		}
		this._position = value;
		this.updatePositionStrategy();
	}

	@Input() componentTooltipAllowMouseOver = false;
	@Input() componentTooltipAutoHide = true;

	private _position:
		| 'bottom'
		| 'right'
		| 'left'
		| 'top'
		| 'global-top-center'
		| 'global-top-left'
		| 'global-bottom-left'
		| 'auto' = 'right';
	private tooltipPortal;
	private overlayRef: OverlayRef;
	private positionStrategy: PositionStrategy;

	private tooltipLeaveSub: Subscription;

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
		if (!this.viewInit) {
			return;
		}
		if (this.overlayRef) {
			this.overlayRef.detach();
			this.overlayRef.dispose();
		}
		const positions: ConnectedPosition[] = this.buildPositions();

		if (this._position === 'global-top-center') {
			this.positionStrategy = this.overlayPositionBuilder.global().centerHorizontally().top();
		} else if (this._position === 'global-top-left') {
			this.positionStrategy = this.overlayPositionBuilder.global().left().top();
		} else if (this._position === 'global-bottom-left') {
			this.positionStrategy = this.overlayPositionBuilder.global().left().bottom();
		} else {
			this.positionStrategy = this.overlayPositionBuilder
				// Create position attached to the elementRef
				.flexibleConnectedTo(this.elementRef)
				// Describe how to connect overlay to the elementRef
				.withPositions(positions);
		}

		// Connect position strategy
		this.overlayRef = this.overlay.create({
			positionStrategy: this.positionStrategy,
			backdropClass: this.componentTooltipBackdropClass,
			hasBackdrop: !!this.componentTooltipBackdropClass,
		});

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		this.onMouseLeave(null, true);
		this.tooltipLeaveSub?.unsubscribe();
	}

	private hideTimeout;

	@HostListener('mouseenter')
	onMouseEnter() {
		// Typically the case when mousing over the tooltip
		if (this.overlayRef.hasAttached()) {
			return;
		}

		if (this.hideTimeout) {
			clearTimeout(this.hideTimeout);
		}
		// Create tooltip portal
		this.tooltipPortal = new ComponentPortal(this._componentType);

		// Attach tooltip portal to overlay
		const tooltipRef = this.overlayRef.attach(this.tooltipPortal);

		// Pass content to tooltip component instance
		tooltipRef.instance.config = this._componentInput;
		if (tooltipRef.instance.mouseLeave) {
			this.tooltipLeaveSub = (tooltipRef.instance.mouseLeave as EventEmitter<MouseEvent>).subscribe((leave) =>
				this.onMouseLeave(leave),
			);
		}

		this.positionStrategy.apply();

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}

		// FIXME: I haven't been able to reproduce the issue, but for some users it happens that the card gets stuck
		// on screen.
		// So we add a timeout to hide the card automatically after a while
		this.hideTimeout = setTimeout(() => {
			if (this.componentTooltipAutoHide) {
				this.onMouseLeave(null);
			}
		}, 15_000);
	}

	@HostListener('mouseleave', ['$event'])
	onMouseLeave(event: MouseEvent, willBeDestroyed = false) {
		if (
			this.componentTooltipAllowMouseOver &&
			(event?.relatedTarget as HTMLDivElement)?.classList?.contains('pack-stat-tooltip')
		) {
			return;
		}

		if (this.hideTimeout) {
			// return;
			// console.log('mouseleave', this._componentInput, new Error().stack);
			clearTimeout(this.hideTimeout);
		}

		if (this.overlayRef) {
			this.overlayRef.detach();
			if (!willBeDestroyed) {
				if (!(this.cdr as ViewRef)?.destroyed) {
					this.cdr.detectChanges();
				}
			}
		}
	}

	private buildPositions(): ConnectedPosition[] {
		switch (this._position) {
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
			case 'auto':
			default:
				return [
					{
						originX: 'center',
						originY: 'top',
						overlayX: 'center',
						overlayY: 'bottom',
					},
					{
						originX: 'end',
						originY: 'top',
						overlayX: 'start',
						overlayY: 'bottom',
					},
					{
						originX: 'start',
						originY: 'top',
						overlayX: 'end',
						overlayY: 'bottom',
					},
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
