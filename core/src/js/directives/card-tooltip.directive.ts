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
import { arraysEqual, sleep } from '../services/utils';
import { CardTooltipPositionType } from './card-tooltip-position.type';

@Directive({
	selector: '[cardTooltip]',
})
// See https://blog.angularindepth.com/building-tooltips-for-angular-3cdaac16d138
export class CardTooltipDirective implements OnDestroy {
	@Input() cardTooltipType: 'GOLDEN' | 'NORMAL' = 'NORMAL';
	@Input() cardTooltipCard: DeckCard = undefined;
	@Input() cardTooltipClass = undefined;
	@Input() cardTooltipDisplayBuffs: boolean;
	@Input() cardTooltipBgs: boolean;
	@Input() cardTooltipLocalized = true;
	@Input() cardTooltipShowRelatedCards: boolean;

	// So that the related card ids can be refreshed while the tooltip is displayed
	// (otherwise it only refreshes on mouseenter)
	@Input() set cardTooltipRelatedCardIds(value: readonly string[]) {
		this._cardTooltipRelatedCardIds = value;
		if (!!this.tooltipRef && !arraysEqual(value, this._cardTooltipRelatedCardIds)) {
			const shouldShowRelatedCards =
				this.cardTooltipShowRelatedCards || !!this._cardTooltipRelatedCardIds?.length;
			this.tooltipRef.instance.relatedCardIds = !shouldShowRelatedCards
				? []
				: this._cardTooltipRelatedCardIds?.length
				? this._cardTooltipRelatedCardIds
				: this.relatedCardIds;
		}
	}

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
	private _cardTooltipRelatedCardIds: readonly string[] = [];

	private _position: CardTooltipPositionType = 'auto';
	private tooltipPortal;
	private overlayRef: OverlayRef;
	private tooltipRef: ComponentRef<CardTooltipComponent>;
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

	// private hideTimeout;

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		this.onMouseLeave(true);
	}

	@HostListener('mouseenter')
	async onMouseEnter() {
		console.debug('mouseenter');
		if (!this.cardId && !this.cardTooltipCard && !this._cardTooltipRelatedCardIds?.length) {
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
		const shouldShowRelatedCards = this.cardTooltipShowRelatedCards || !!this._cardTooltipRelatedCardIds?.length;
		this.tooltipRef = this.overlayRef.attach(this.tooltipPortal);
		// Pass content to tooltip component instance
		this.tooltipRef.instance.additionalClass = this.cardTooltipClass;
		this.tooltipRef.instance.relatedCardIds = !shouldShowRelatedCards
			? []
			: this._cardTooltipRelatedCardIds?.length
			? this._cardTooltipRelatedCardIds
			: this.relatedCardIds;
		this.tooltipRef.instance.viewRef = this.tooltipRef;

		if (this.cardTooltipCard) {
			this.tooltipRef.instance.displayBuffs = this.cardTooltipDisplayBuffs;
			console.debug('tooltip', 'cardTooltipCard', this.cardTooltipCard);
			this.tooltipRef.instance.cardTooltipCard = this.cardTooltipCard;
		} else {
			console.debug('tooltip', 'cardTooltipCard 2');
			this.tooltipRef.instance.cardId = this.cardId;
			this.tooltipRef.instance.displayBuffs = false;
			this.tooltipRef.instance.cardType = this.cardTooltipType;
			this.tooltipRef.instance.cardTooltipBgs = this.cardTooltipBgs;
			this.tooltipRef.instance.localized = this.cardTooltipLocalized;
		}

		this.positionStrategy.apply();

		await sleep(10);
		this.reposition(this.tooltipRef);
		// FIXME: I haven't been able to reproduce the issue, but for some users it happens that the card gets stuck
		// on screen.
		// So we add a timeout to hide the card automatically after a while
		// TODO: add that in the tooltip component itself, so that it destroys itself (which might solve some issues with
		// the host component being destroyed)
		// this.hideTimeout = setTimeout(() => {
		// 	this.onMouseLeave();
		// }, 15_000);
	}

	@HostListener('mouseleave')
	onMouseLeave(willBeDestroyed = false) {
		// return;
		this.positionStrategyDirty = true;

		// if (this.hideTimeout) {
		// 	clearTimeout(this.hideTimeout);
		// }

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
		this.tooltipRef = null;
	}

	private async reposition(tooltipRef) {
		await sleep(10);
		let positionUpdated = true;
		let previousTooltipLeft = 0;
		let previousTooltipTop = 0;
		while (positionUpdated && !!tooltipRef) {
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
