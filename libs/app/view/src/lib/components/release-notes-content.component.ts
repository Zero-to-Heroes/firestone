import { Overlay, OverlayPositionBuilder, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ComponentRef,
	HostListener,
	Input,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CardTooltipComponent } from '@firestone/shared/common/view';
import { sleep } from '@firestone/shared/framework/common';

@Component({
	standalone: false,
	selector: 'release-notes-content',
	styleUrls: ['./release-notes-content.component.scss'],
	template: ` <div class="parsed-text" [innerHTML]="safeHtml"></div> `,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReleaseNotesContentComponent implements OnDestroy {
	@Input() set html(value: unknown) {
		const text = typeof value === 'string' ? value : '';
		this.safeHtml = this.sanitizer.bypassSecurityTrustHtml(text);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}

	safeHtml: SafeHtml = '';

	private overlayRef: OverlayRef | null;
	private tooltipRef: ComponentRef<CardTooltipComponent> | null;
	private currentCardId: string | null;

	constructor(
		private readonly sanitizer: DomSanitizer,
		private readonly overlay: Overlay,
		private readonly overlayPositionBuilder: OverlayPositionBuilder,
		private readonly cdr: ChangeDetectorRef,
	) {}

	ngOnDestroy(): void {
		this.hideTooltip();
	}

	@HostListener('mouseover', ['$event'])
	onMouseOver(event: MouseEvent): void {
		if (event.shiftKey) {
			return;
		}

		const cardElement = this.findCardElement(event.target);
		if (!cardElement) {
			return;
		}

		const cardId = cardElement.getAttribute('data-card-id');
		if (!cardId || cardId === this.currentCardId) {
			return;
		}

		this.showTooltip(cardElement, cardId);
	}

	@HostListener('mouseout', ['$event'])
	onMouseOut(event: MouseEvent): void {
		if (event.shiftKey) {
			return;
		}

		const cardElement = this.findCardElement(event.target);
		const relatedCardElement = this.findCardElement(event.relatedTarget);
		if (cardElement && cardElement === relatedCardElement) {
			return;
		}

		this.hideTooltip();
	}

	private findCardElement(target: EventTarget | null): HTMLElement | null {
		if (!(target instanceof HTMLElement)) {
			return null;
		}
		return target.closest('.release-notes-card') as HTMLElement | null;
	}

	private async showTooltip(cardElement: HTMLElement, cardId: string): Promise<void> {
		this.hideTooltip();
		this.currentCardId = cardId;

		const positionStrategy = this.overlayPositionBuilder
			.flexibleConnectedTo(cardElement)
			.withPositions([
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
			]);

		this.overlayRef = this.overlay.create({ positionStrategy });
		this.tooltipRef = this.overlayRef.attach(new ComponentPortal(CardTooltipComponent));
		this.tooltipRef.instance.cardId = cardId;
		this.tooltipRef.instance.localized = true;
		this.tooltipRef.instance.displayBuffs = false;

		positionStrategy.apply();
		await this.repositionTooltip(cardElement);
	}

	private async repositionTooltip(cardElement: HTMLElement): Promise<void> {
		await sleep(5);
		let positionUpdated = true;
		let previousLeft = 0;
		let previousTop = 0;

		while (positionUpdated && this.tooltipRef) {
			const tooltipRect = this.tooltipRef.location.nativeElement.getBoundingClientRect();
			const targetRect = cardElement.getBoundingClientRect();
			this.tooltipRef.instance.relativePosition = tooltipRect.x < targetRect.x ? 'left' : 'right';
			this.overlayRef?.updatePosition();

			positionUpdated = previousLeft !== tooltipRect.left || previousTop !== tooltipRect.top;
			previousLeft = tooltipRect.left;
			previousTop = tooltipRect.top;
			await sleep(5);
		}
	}

	private hideTooltip(): void {
		this.currentCardId = null;

		if (this.tooltipRef) {
			try {
				this.tooltipRef.destroy();
			} catch {
				// already destroyed
			}
			this.tooltipRef = null;
		}

		if (this.overlayRef) {
			try {
				if (this.overlayRef.hasAttached()) {
					this.overlayRef.detach();
				}
				this.overlayRef.dispose();
			} catch {
				// already disposed
			}
			this.overlayRef = null;
		}
	}
}
