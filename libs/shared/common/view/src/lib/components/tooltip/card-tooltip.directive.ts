/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ConnectedPosition, Overlay, OverlayPositionBuilder, OverlayRef, PositionStrategy } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import {
	AfterContentInit,
	ChangeDetectorRef,
	ComponentRef,
	Directive,
	ElementRef,
	HostListener,
	Input,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { sleep } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { CardTooltipPositionType } from './card-tooltip-position.type';
import { CardTooltipAdditionalInfo, CardTooltipComponent, isGuessedInfoEmpty } from './card-tooltip.component';

@Directive({
	standalone: false,
	selector: '[cardTooltip]',
})
// See https://blog.angularindepth.com/building-tooltips-for-angular-3cdaac16d138
export class CardTooltipDirective implements OnDestroy, AfterContentInit {
	@Input() cardTooltipType: 'NORMAL' | 'GOLDEN' | 'DIAMOND' | 'SIGNATURE' = 'NORMAL';
	@Input() cardTooltipCard:
		| {
				cardId: string;
				buffCardIds?: readonly string[];
				creatorCardId?: string;
				lastAffectedByCardId?: string;
		  }
		| null
		| undefined = undefined;
	@Input() cardTooltipClass: string | null | undefined = undefined;
	@Input() cardTooltipDisplayBuffs: boolean;
	@Input() cardTooltipBgs: boolean;
	@Input() cardTooltipLocalized = true;
	@Input() cardTooltipShowRelatedCards: boolean;
	@Input() cardTooltipAdditionalInfo: CardTooltipAdditionalInfo;
	@Input() cardTooltipRelatedCardIdsHeader: string;

	// So that the related card ids can be refreshed while the tooltip is displayed
	// (otherwise it only refreshes on mouseenter)
	@Input() set cardTooltipRelatedCardIds(value: readonly string[] | undefined) {
		this._cardTooltipRelatedCardIds = value ?? [];
		// console.debug('setting related cards in directive input', value);
		if (!!this.tooltipRef) {
			const shouldShowRelatedCards =
				this.cardTooltipShowRelatedCards || !!this._cardTooltipRelatedCardIds?.length;
			const relatedCards = !shouldShowRelatedCards
				? []
				: this._cardTooltipRelatedCardIds?.length
				? this._cardTooltipRelatedCardIds
				: this.relatedCardIds;
			this.tooltipRef.instance.relatedCardIds = relatedCards;
		}
	}

	@Input() set cardTooltip(value: string | null | undefined) {
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

	@Input('cardTooltipForceMouseOver') set forceMouseOver(value: boolean) {
		this.forceMouseOver$$.next(value);
	}

	cardId: string | null | undefined;

	private relatedCardIds: readonly string[];
	private _cardTooltipRelatedCardIds: readonly string[] = [];

	private _position: CardTooltipPositionType = 'auto';
	private tooltipPortal;
	private overlayRef: OverlayRef;
	private tooltipRef: ComponentRef<CardTooltipComponent> | null;
	private positionStrategy: PositionStrategy | null;

	private positionStrategyDirty = true;

	private forceMouseOver$$ = new BehaviorSubject<boolean>(false);
	private mouseOverSub: Subscription;

	constructor(
		private readonly allCards: CardsFacadeService,
		private readonly overlayPositionBuilder: OverlayPositionBuilder,
		private readonly elementRef: ElementRef,
		private readonly overlay: Overlay,
		private readonly cdr: ChangeDetectorRef,
	) {}

	ngAfterContentInit(): void {
		this.mouseOverSub = this.forceMouseOver$$.subscribe((value) => {
			if (value) {
				this.onMouseEnter(null, true);
			} else {
				this.onMouseLeave(null);
			}
		});
	}

	private updatePositionStrategy() {
		if (this.positionStrategy) {
			this.positionStrategy.detach?.();
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

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		this.onMouseLeave(null, true);
		this.mouseOverSub?.unsubscribe();
	}

	@HostListener('mouseenter', ['$event'])
	async onMouseEnter(event: MouseEvent | null, forced?: boolean) {
		if (event?.shiftKey) {
			return;
		}

		if (!this.cardId && !this.cardTooltipCard && !this._cardTooltipRelatedCardIds?.length) {
			return;
		}
		if (this._position === 'none') {
			return;
		}

		const shouldShowRelatedCards = this.cardTooltipShowRelatedCards || !!this._cardTooltipRelatedCardIds?.length;
		const relatedCards = !shouldShowRelatedCards
			? []
			: this._cardTooltipRelatedCardIds?.length
			? this._cardTooltipRelatedCardIds
			: this.relatedCardIds;

		if (forced && !relatedCards?.length && isGuessedInfoEmpty(this.cardTooltipAdditionalInfo)) {
			console.debug('[card-tooltip] forced mouse over but no related cards, not showing tooltip');
			return;
		}

		if (this.positionStrategyDirty) {
			this.updatePositionStrategy();
			this.positionStrategyDirty = false;
		}

		// Create tooltip portal
		this.tooltipPortal = new ComponentPortal(CardTooltipComponent);

		// Attach tooltip portal to overlay
		this.tooltipRef = this.overlayRef.attach(this.tooltipPortal);
		if (!this.tooltipRef) {
			console.warn('[card-tooltip] tooltipRef is null, not showing tooltip');
			return;
		}

		// Pass content to tooltip component instance
		// this.tooltipRef.instance.opacity = 0;
		this.tooltipRef.instance.additionalClass = this.cardTooltipClass;
		this.tooltipRef.instance.relatedCardIds = relatedCards;
		this.tooltipRef.instance.relatedCardIdsHeader = this.cardTooltipRelatedCardIdsHeader;
		this.tooltipRef.instance.viewRef = this.tooltipRef;

		if (this.cardTooltipCard) {
			this.tooltipRef.instance.displayBuffs = this.cardTooltipDisplayBuffs;
			this.tooltipRef.instance.cardTooltipCard = this.cardTooltipCard;
		} else {
			this.tooltipRef.instance.cardId = this.cardId;
			this.tooltipRef.instance.displayBuffs = false;
			this.tooltipRef.instance.cardType = this.cardTooltipType;
			this.tooltipRef.instance.cardTooltipBgs = this.cardTooltipBgs;
			this.tooltipRef.instance.localized = this.cardTooltipLocalized;
		}
		this.tooltipRef.instance.additionalInfo = this.cardTooltipAdditionalInfo;

		this.positionStrategy!.apply();

		await this.reposition(this.tooltipRef);
		// await sleep(20);
		// if (this.tooltipRef) {
		// 	try {
		// 		this.tooltipRef.instance.opacity = 1;
		// 	} catch (e) {
		// 		console.log('tooltipRef was alredy destroyed when setting opacity for card toltip');
		// 	}
		// }
	}

	// @HostListener('document:keydown', ['$event'])
	// onKeyDown(event: KeyboardEvent) {
	// 	console.debug('handling keydown', event.key);
	// 	if (event.key === 'q') {
	// 		this.onMouseLeave(null);
	// 	}
	// }

	@HostListener('mouseleave', ['$event'])
	onMouseLeave(event: MouseEvent | null, willBeDestroyed = false) {
		if (event?.shiftKey) {
			return;
		}

		this.positionStrategyDirty = true;

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
		await sleep(5);
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
			await sleep(5);
		}
	}

	private buildPositions(position: CardTooltipPositionType) {
		let positions: ConnectedPosition[] = [];
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
