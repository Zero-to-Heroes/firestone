import { ConnectedPosition, Overlay, OverlayPositionBuilder, OverlayRef, PositionStrategy } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { ChangeDetectorRef, ComponentRef, Directive, ElementRef, HostListener, Input, OnDestroy } from '@angular/core';
import { CardTooltipComponent } from '../components/tooltip/card-tooltip.component';
import { DeckCard } from '../models/decktracker/deck-card';
import { CardTooltipPositionType } from './card-tooltip-position.type';

@Directive({
	selector: '[cardTooltip]',
})
// See https://blog.angularindepth.com/building-tooltips-for-angular-3cdaac16d138
export class CardTooltipDirective implements OnDestroy {
	@Input('cardTooltip') cardId = undefined;
	@Input() cardTooltipType: 'GOLDEN' | 'NORMAL' = 'NORMAL';
	@Input() cardTooltipCard: DeckCard = undefined;
	@Input() cardTooltipText = undefined;
	@Input() cardTooltipClass = undefined;
	@Input() cardTooltipDisplayBuffs: boolean;
	@Input() cardTooltipBgs: boolean;
	@Input() cardTooltipLocalized = true;

	@Input('cardTooltipPosition') set position(value: CardTooltipPositionType) {
		if (value !== this._position) {
			this._position = value;
			this.positionStrategyDirty = true;
		}
	}

	private _position: CardTooltipPositionType;
	private tooltipPortal;
	private overlayRef: OverlayRef;
	private positionStrategy: PositionStrategy;

	private positionStrategyDirty = true;

	constructor(
		private overlayPositionBuilder: OverlayPositionBuilder,
		private elementRef: ElementRef,
		private overlay: Overlay,
		private cdr: ChangeDetectorRef,
	) {}

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
		if (this._position === 'none') {
			return;
		}
		let positions: ConnectedPosition[] = [
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
		if (this._position === 'left') {
			positions = [
				{
					originX: 'start',
					originY: 'center',
					overlayX: 'end',
					overlayY: 'center',
				},
			];
		} else if (this._position === 'right') {
			positions = [
				{
					originX: 'end',
					originY: 'center',
					overlayX: 'start',
					overlayY: 'center',
				},
			];
		} else if (this._position === 'bottom') {
			positions = [
				{
					originX: 'center',
					originY: 'bottom',
					overlayX: 'center',
					overlayY: 'top',
				},
			];
		} else if (this._position === 'bottom-right') {
			positions = [
				{
					originX: 'end',
					originY: 'bottom',
					overlayX: 'start',
					overlayY: 'top',
				},
			];
		} else if (this._position === 'top-right') {
			positions = [
				{
					originX: 'end',
					originY: 'top',
					overlayX: 'start',
					overlayY: 'bottom',
				},
			];
		} else if (this._position === 'top-left') {
			positions = [
				{
					originX: 'start',
					originY: 'top',
					overlayX: 'end',
					overlayY: 'bottom',
				},
			];
		} else if (this._position === 'auto') {
			positions = [
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
		this.positionStrategy = this.overlayPositionBuilder
			// Create position attached to the elementRef
			.flexibleConnectedTo(this.elementRef)
			// Describe how to connect overlay to the elementRef
			.withPositions(positions);

		// Connect position strategy
		this.overlayRef = this.overlay.create({ positionStrategy: this.positionStrategy });
		// if (!(this.cdr as ViewRef)?.destroyed) {
		// 	this.cdr.detectChanges();
		// }
	}

	private hideTimeout;

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		this.onMouseLeave();
	}

	@HostListener('mouseenter')
	onMouseEnter() {
		if (this.hideTimeout) {
			clearTimeout(this.hideTimeout);
		}

		if (this._position === 'none') {
			return;
		}
		if (!this.cardId && !this.cardTooltipCard) {
			return;
		}

		if (this.positionStrategyDirty) {
			this.updatePositionStrategy();
			this.positionStrategyDirty = false;
		}
		// Create tooltip portal
		this.tooltipPortal = new ComponentPortal(CardTooltipComponent);

		// Attach tooltip portal to overlay
		const tooltipRef: ComponentRef<CardTooltipComponent> = this.overlayRef.attach(this.tooltipPortal);

		// Pass content to tooltip component instance

		tooltipRef.instance.additionalClass = this.cardTooltipClass;
		if (this.cardTooltipCard) {
			tooltipRef.instance.displayBuffs = this.cardTooltipDisplayBuffs;
			tooltipRef.instance.cardTooltipCard = this.cardTooltipCard;
		} else {
			tooltipRef.instance.cardTooltipCard = undefined;
			tooltipRef.instance.displayBuffs = undefined;
			tooltipRef.instance.cardType = this.cardTooltipType;
			tooltipRef.instance.cardTooltipBgs = this.cardTooltipBgs;
			tooltipRef.instance.localized = this.cardTooltipLocalized;
			tooltipRef.instance.text = this.cardTooltipText;
			// Keep last so that we only call the updateInfos() method once
			tooltipRef.instance.cardId = this.cardId;
		}

		this.positionStrategy.apply();
		// if (!(this.cdr as ViewRef)?.destroyed) {
		// 	this.cdr.detectChanges();
		// }

		// FIXME: I haven't been able to reproduce the issue, but for some users it happens that the card gets stuck
		// on screen.
		// So we add a timeout to hide the card automatically after a while
		this.hideTimeout = setTimeout(() => {
			this.onMouseLeave();
		}, 15_000);
	}

	@HostListener('mouseleave')
	onMouseLeave() {
		if (this.hideTimeout) {
			clearTimeout(this.hideTimeout);
		}

		if (this.overlayRef) {
			this.overlayRef.detach();
			// if (!(this.cdr as ViewRef)?.destroyed) {
			// 	this.cdr.detectChanges();
			// }
		}
	}
}
