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
	ViewRef,
} from '@angular/core';
import { CardsFacadeService } from '@services/cards-facade.service';
import { CardTooltipComponent } from '../components/tooltip/card-tooltip.component';
import { DeckCard } from '../models/decktracker/deck-card';
import { sleep } from '../services/utils';
import { CardTooltipPositionType } from './card-tooltip-position.type';

@Directive({
	selector: '[cardTooltip]',
})
// See https://blog.angularindepth.com/building-tooltips-for-angular-3cdaac16d138
export class CardTooltipDirective implements OnDestroy {
	@Input() cardTooltipType: 'GOLDEN' | 'NORMAL' = 'NORMAL';
	@Input() cardTooltipCard: DeckCard = undefined;
	@Input() cardTooltipText = undefined;
	@Input() cardTooltipClass = undefined;
	@Input() cardTooltipDisplayBuffs: boolean;
	@Input() cardTooltipBgs: boolean;
	@Input() cardTooltipLocalized = true;
	@Input() cardTooltipShowRelatedCards: boolean;
	@Input() cardTooltipRelatedCardIds: readonly string[] = [];

	@Input() set cardTooltip(value: string) {
		this.cardId = value;

		if (!!this.cardId?.length) {
			this.relatedCardIds = this.cardId
				.split(',')
				.flatMap(
					(cardId) =>
						this.allCards
							.getCard(cardId)
							?.relatedCardDbfIds?.map((r) => this.allCards.getCardFromDbfId(r)?.id) ?? [],
				);
		}
	}

	@Input('cardTooltipPosition') set position(value: CardTooltipPositionType) {
		if (value !== this._position) {
			this._position = value;
			this.positionStrategyDirty = true;
		}
	}

	cardId: string;

	private relatedCardIds: readonly string[];

	private _position: CardTooltipPositionType = 'auto';
	private tooltipPortal;
	private overlayRef: OverlayRef;
	private positionStrategy: PositionStrategy;

	private positionStrategyDirty = true;

	constructor(
		private readonly allCards: CardsFacadeService,
		private readonly overlayPositionBuilder: OverlayPositionBuilder,
		private readonly elementRef: ElementRef,
		private readonly overlay: Overlay,
		private readonly cdr: ChangeDetectorRef,
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

		const positions: ConnectedPosition[] = this.buildPositions(this._position);

		this.positionStrategy = this.overlayPositionBuilder
			.flexibleConnectedTo(this.elementRef)
			.withPositions(positions);

		this.overlayRef = this.overlay.create({
			positionStrategy: this.positionStrategy,
		});
	}

	private hideTimeout;

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		this.onMouseLeave(true);
	}

	@HostListener('mouseenter')
	onMouseEnter() {
		if (this.hideTimeout) {
			clearTimeout(this.hideTimeout);
		}
		if (!this.cardId && !this.cardTooltipCard) {
			return;
		}
		if (this._position === 'none') {
			return;
		}

		if (this.positionStrategyDirty) {
			this.updatePositionStrategy();
			this.positionStrategyDirty = false;
		}

		//console.debug('after updating position', this.positionStrategy, this._position);
		// Create tooltip portal
		this.tooltipPortal = new ComponentPortal(CardTooltipComponent);

		// Attach tooltip portal to overlay
		const shouldShowRelatedCards = this.cardTooltipShowRelatedCards || !!this.cardTooltipRelatedCardIds?.length;
		const tooltipRef: ComponentRef<CardTooltipComponent> = this.overlayRef.attach(this.tooltipPortal);

		// Pass content to tooltip component instance
		tooltipRef.instance.additionalClass = this.cardTooltipClass;
		tooltipRef.instance.relatedCardIds = !shouldShowRelatedCards
			? []
			: this.cardTooltipRelatedCardIds?.length
			? this.cardTooltipRelatedCardIds
			: this.relatedCardIds;

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
		this.reposition(tooltipRef);
		// FIXME: I haven't been able to reproduce the issue, but for some users it happens that the card gets stuck
		// on screen.
		// So we add a timeout to hide the card automatically after a while
		this.hideTimeout = setTimeout(() => {
			this.onMouseLeave();
		}, 15_000);
	}

	@HostListener('mouseleave')
	onMouseLeave(willBeDestroyed = false) {
		this.positionStrategyDirty = true;

		if (this.hideTimeout) {
			clearTimeout(this.hideTimeout);
		}

		if (this.overlayRef) {
			this.overlayRef.detach();
			// This can cause the "destroyed of null" error if not guarded when component is destroyed
			if (!willBeDestroyed) {
				// The guard is not necessary with markForCheck(), but this doesn't work well
				if (!(this.cdr as ViewRef)?.destroyed) {
					this.cdr.detectChanges();
				}
			}
		}
	}

	private async reposition(tooltipRef) {
		let positionUpdated = true;
		let previousTooltipLeft = 0;
		let previousTooltipTop = 0;
		while (positionUpdated) {
			const tooltipRect = tooltipRef.location.nativeElement.getBoundingClientRect();
			const targetRect = this.elementRef.nativeElement.getBoundingClientRect();
			const relativePosition = tooltipRect.x < targetRect.x ? 'left' : 'right';
			tooltipRef.instance.relativePosition = relativePosition;
			this.overlayRef.updatePosition();

			positionUpdated = previousTooltipLeft !== tooltipRect.left || previousTooltipTop !== tooltipRect.top;
			previousTooltipLeft = tooltipRect.left;
			previousTooltipTop = tooltipRect.top;
			await sleep(10);
		}
	}

	private buildPositions(position: CardTooltipPositionType) {
		let positions = [];
		if (position === 'left') {
			positions = [
				{
					originX: 'start',
					originY: 'center',
					overlayX: 'end',
					overlayY: 'center',
				},
			];
		} else if (position === 'right') {
			positions = [
				{
					originX: 'end',
					originY: 'center',
					overlayX: 'start',
					overlayY: 'center',
				},
			];
		} else if (position === 'bottom') {
			positions = [
				{
					originX: 'center',
					originY: 'bottom',
					overlayX: 'center',
					overlayY: 'top',
				},
			];
		} else if (position === 'bottom-right') {
			positions = [
				{
					originX: 'end',
					originY: 'bottom',
					overlayX: 'start',
					overlayY: 'top',
				},
			];
		} else if (position === 'bottom-left') {
			positions = [
				{
					originX: 'start',
					originY: 'bottom',
					overlayX: 'end',
					overlayY: 'top',
				},
			];
		} else if (position === 'top-right') {
			positions = [
				{
					originX: 'end',
					originY: 'top',
					overlayX: 'start',
					overlayY: 'bottom',
				},
			];
		} else if (position === 'top-left') {
			positions = [
				{
					originX: 'start',
					originY: 'top',
					overlayX: 'end',
					overlayY: 'bottom',
				},
			];
		} else if (position === 'top') {
			positions = [
				{
					originX: 'center',
					originY: 'top',
					overlayX: 'center',
					overlayY: 'bottom',
				},
			];
		} else {
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
				// {
				// 	originX: 'start',
				// 	originY: 'bottom',
				// 	overlayX: 'end',
				// 	overlayY: 'top',
				// },
				// {
				// 	originX: 'end',
				// 	originY: 'bottom',
				// 	overlayX: 'start',
				// 	overlayY: 'top',
				// },
				// {
				// 	originX: 'start',
				// 	originY: 'top',
				// 	overlayX: 'end',
				// 	overlayY: 'bottom',
				// },
				// {
				// 	originX: 'end',
				// 	originY: 'top',
				// 	overlayX: 'start',
				// 	overlayY: 'bottom',
				// },
			];
		}
		return positions;
	}
}
