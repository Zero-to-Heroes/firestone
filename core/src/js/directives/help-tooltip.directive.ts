import { ConnectedPosition, Overlay, OverlayPositionBuilder, OverlayRef, PositionStrategy } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import {
	ChangeDetectorRef,
	ComponentRef,
	Directive,
	ElementRef,
	HostListener,
	Input,
	OnDestroy,
	OnInit,
	Optional,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { HelpTooltipComponent } from '../components/tooltip/help-tooltip.component';
import { OverwolfService } from '../services/overwolf.service';

@Directive({
	selector: '[helpTooltip]',
})
// See https://blog.angularindepth.com/building-tooltips-for-angular-3cdaac16d138
export class HelpTooltipDirective implements OnInit, OnDestroy {
	_text = '';

	@Input('helpTooltipPosition') position: 'bottom' | 'right' | 'left' | 'top' | 'bottom-left' = 'bottom';

	@Input('helpTooltip') set text(value: string) {
		if (value === this._text) {
			console.debug('same value, returning', value);
			return;
		}
		this._text = value;
		//console.debug('updating text in tooltip', value);
		if (!this._text && this.overlayRef) {
			this.overlayRef?.detach();
		} else if (this.tooltipRef) {
			//console.debug('existing tooltip', value);
			this.tooltipRef.instance.text = this._text;
		}
	}

	@Input() bindTooltipToGameWindow = false;
	@Input() stayOpenOnClick = false;
	@Input() helpTooltipVisibleBeforeHover = false;
	@Input() helpTooltipClasses: string;
	@Input('helpTooltipShowArrow') showArrow = false;

	@Input('helpTooltipOnlyShowOnClick') onlyShowOnClick = false;
	@Input('helpTooltipClickTimeout') clickTimeout = 2000;

	private tooltipPortal: ComponentPortal<any>;
	private overlayRef: OverlayRef;
	private positionStrategy: PositionStrategy;
	private tooltipRef: ComponentRef<HelpTooltipComponent>;
	private target: ElementRef;

	constructor(
		private readonly overlayPositionBuilder: OverlayPositionBuilder,
		private readonly elementRef: ElementRef,
		private readonly overlay: Overlay,
		private readonly cdr: ChangeDetectorRef,
		@Optional() private readonly ow: OverwolfService,
		private readonly renderer: Renderer2,
	) {}

	ngOnInit() {
		this.target = this.elementRef.nativeElement.querySelector('[helpTooltipTarget]') || this.elementRef;
		//console.debug('targeting tooltip help element', this.position, target);

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
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
		if (this.helpTooltipVisibleBeforeHover) {
			this.onMouseEnter();
		}
	}

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		if (this.overlayRef) {
			this.overlayRef?.detach();
		}
	}

	@HostListener('mouseenter')
	async onMouseEnter(override = false) {
		if (!this._text || (!override && this.onlyShowOnClick)) {
			return;
		}

		if (this.overlayRef) {
			this.overlayRef?.detach();
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

		// Pass content to tooltip component instance
		this.tooltipRef.instance.text = this._text;
		this.tooltipRef.instance.showArrow = this.showArrow;
		this.tooltipRef.instance.classes = this.helpTooltipClasses;
		this.tooltipRef.instance.setTarget(this.target);

		this.positionStrategy.apply();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}

		// These are used by the decktracker, since the window has some transparent space to the left
		// and right that can go out of the game's window
		// For all other cases, it should not be needed
		if (this.bindTooltipToGameWindow && this.ow?.isOwEnabled()) {
			const window = await this.ow.getCurrentWindow();
			const gameInfo = await this.ow.getRunningGameInfo();
			if (this.tooltipRef) {
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

		if (this.overlayRef?.hasAttached()) {
			this.overlayRef?.detach();
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		}
		if (this.tooltipRef) {
			this.tooltipRef = undefined;
		}
	}

	@HostListener('mouseleave')
	onMouseLeave(override = false) {
		if (this.onlyShowOnClick && !override) {
			return;
		}
		if (this.overlayRef?.hasAttached()) {
			this.overlayRef?.detach();
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		}
		if (this.tooltipRef) {
			this.tooltipRef = undefined;
		}
	}

	// Hide tooltip if a scroll wheel is detected anywhere
	@HostListener('window:mousewheel')
	onMouseWheel() {
		if (this.overlayRef?.hasAttached()) {
			this.overlayRef?.detach();
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		}
		if (this.tooltipRef) {
			this.tooltipRef = undefined;
		}
	}
}
