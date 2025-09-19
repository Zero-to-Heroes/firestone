/* eslint-disable no-mixed-spaces-and-tabs */
import { ConnectedPosition, Overlay, OverlayPositionBuilder, OverlayRef, PositionStrategy } from '@angular/cdk/overlay';
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
	Optional,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';
import { OverwolfService } from '@firestone/shared/framework/core';
import { HelpTooltipComponent } from './help-tooltip.component';

@Directive({
	standalone: false,
	selector: '[helpTooltip]',
})
// See https://blog.angularindepth.com/building-tooltips-for-angular-3cdaac16d138
export class HelpTooltipDirective implements OnDestroy, AfterViewInit {
	_text = '';

	@Input('helpTooltipPosition') position: 'bottom' | 'right' | 'left' | 'top' | 'bottom-left' = 'bottom';

	@Input('helpTooltip') set text(value: string | SafeHtml | null | undefined) {
		if (!value || value === this._text) {
			return;
		}
		this._text = value?.toString();
		if (!this._text && this.overlayRef) {
			this.overlayRef?.detach();
		} else if (this.tooltipRef) {
			this.tooltipRef.instance.text = this._text;
		}
	}

	@Input() bindTooltipToGameWindow: boolean | null = false;
	@Input() stayOpenOnClick = false;
	@Input() helpTooltipVisibleBeforeHover = false;
	@Input() helpTooltipClasses: string;
	@Input() helpTooltipWidth: number;
	@Input('helpTooltipShowArrow') showArrow = false;

	@Input('helpTooltipOnlyShowOnClick') onlyShowOnClick = false;
	@Input('helpTooltipClickTimeout') clickTimeout = 2000;

	private tooltipPortal: ComponentPortal<any>;
	private overlayRef: OverlayRef | null;
	private positionStrategy: PositionStrategy | null;
	private tooltipRef: ComponentRef<HelpTooltipComponent> | null;
	private target: ElementRef;

	constructor(
		private readonly overlayPositionBuilder: OverlayPositionBuilder,
		private readonly elementRef: ElementRef,
		private readonly overlay: Overlay,
		private readonly cdr: ChangeDetectorRef,
		@Optional() private readonly ow: OverwolfService,
		private readonly renderer: Renderer2,
	) {}

	ngAfterViewInit(): void {
		if (this.helpTooltipVisibleBeforeHover) {
			this.onMouseEnter();
		}
	}

	private initOverlay() {
		this.target = this.elementRef.nativeElement.querySelector('[helpTooltipTarget]') || this.elementRef;

		const positionArrays: ConnectedPosition[] =
			this.position === 'bottom'
				? [
						{
							originX: 'center',
							originY: 'bottom',
							overlayX: 'center',
							overlayY: 'top',
						},
						{
							originX: 'start',
							originY: 'top',
							overlayX: 'start',
							overlayY: 'bottom',
						},
						{
							originX: 'start',
							originY: 'bottom',
							overlayX: 'start',
							overlayY: 'top',
						},
					]
				: this.position === 'right'
					? [
							{
								originX: 'end',
								originY: 'center',
								overlayX: 'start',
								overlayY: 'center',
							},
						]
					: this.position === 'top'
						? [
								{
									originX: 'center',
									originY: 'top',
									overlayX: 'center',
									overlayY: 'bottom',
								},
							]
						: this.position === 'bottom-left'
							? [
									{
										originX: 'end',
										originY: 'bottom',
										overlayX: 'end',
										overlayY: 'top',
									},
								]
							: [
									{
										originX: 'start',
										originY: 'center',
										overlayX: 'end',
										overlayY: 'center',
									},
								];

		this.positionStrategy = this.overlayPositionBuilder
			// Create position attached to the elementRef
			.flexibleConnectedTo(this.target)
			.withFlexibleDimensions(false)
			.withPush(false)
			.withViewportMargin(10)
			.withPositions(positionArrays);
		// Connect position strategy
		this.overlayRef = this.overlay.create({
			positionStrategy: this.positionStrategy,
			scrollStrategy: this.overlay.scrollStrategies.reposition(),
		});
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

	@HostListener('mouseenter')
	async onMouseEnter(override = false) {
		if (!this._text || (!override && this.onlyShowOnClick)) {
			return;
		}

		this.destroyOverlay();
		this.initOverlay();

		if (!this.overlayRef) {
			return;
		}

		// Create tooltip portal
		this.tooltipPortal = new ComponentPortal(HelpTooltipComponent);

		// Attach tooltip portal to overlay
		try {
			this.tooltipRef = this.overlayRef.attach(this.tooltipPortal);
		} catch (e) {
			this.overlayRef?.detach();
			this.tooltipRef = this.overlayRef.attach(this.tooltipPortal);
		}

		if (!this.tooltipRef) {
			return;
		}

		// Pass content to tooltip component instance
		this.tooltipRef.instance.text = this._text;
		this.tooltipRef.instance.showArrow = this.showArrow;
		this.tooltipRef.instance.classes = this.helpTooltipClasses;
		this.tooltipRef.instance.width = this.helpTooltipWidth;
		this.tooltipRef.instance.setTarget(this.target);

		this.positionStrategy?.apply();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}

		// These are used by the decktracker, since the window has some transparent space to the left
		// and right that can go out of the game's window
		// For all other cases, it should not be needed
		if (this.bindTooltipToGameWindow && this.ow?.isOwEnabled()) {
			const window = await this.ow.getCurrentWindow();
			const gameInfo = await this.ow.getRunningGameInfo();
			if (this.tooltipRef && this.overlayRef) {
				const tooltipLeft =
					window.left +
					(this.overlayRef.hostElement.getBoundingClientRect() as any).x +
					(this.tooltipRef.location.nativeElement.getBoundingClientRect() as any).x;
				if (tooltipLeft < 0) {
					this.renderer.setStyle(this.tooltipRef.location.nativeElement, 'marginLeft', `${-tooltipLeft}px`);
				}

				const tooltipRight =
					window.left +
					(this.overlayRef.hostElement.getBoundingClientRect() as any).x +
					(this.tooltipRef.location.nativeElement.getBoundingClientRect() as any).x +
					(this.tooltipRef.location.nativeElement.getBoundingClientRect() as any).width;
				if (gameInfo && tooltipRight > gameInfo.logicalWidth) {
					this.renderer.setStyle(
						this.tooltipRef.location.nativeElement,
						'marginLeft',
						`${gameInfo.logicalWidth - tooltipRight}px`,
					);
				}
			}
		}
	}

	@HostListener('click')
	onMouseClick() {
		if (this.onlyShowOnClick) {
			this.onMouseEnter(true);
			setTimeout(() => this.onMouseLeave(true), this.clickTimeout);
			return;
		}

		if (this.stayOpenOnClick) {
			return;
		}

		this.destroyOverlay();
	}

	@HostListener('mouseleave')
	onMouseLeave(override = false) {
		if (this.onlyShowOnClick && !override) {
			return;
		}
		this.destroyOverlay();
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

	// This causes performance issues on Chrome, even with an empty method. So let's ditch it for now
	// Hide tooltip if a scroll wheel is detected anywhere
	// @HostListener('window:mousewheel')
	// onMouseWheel() {
	// 	if (this.overlayRef?.hasAttached()) {
	// 		this.overlayRef?.detach();
	// 		if (!(this.cdr as ViewRef)?.destroyed) {
	// 			this.cdr.detectChanges();
	// 		}
	// 	}
	// 	if (this.tooltipRef) {
	// 		this.tooltipRef = undefined;
	// 	}
	// }
}
