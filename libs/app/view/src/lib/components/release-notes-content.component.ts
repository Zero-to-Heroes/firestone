import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	Input,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
	standalone: false,
	selector: 'release-notes-content',
	styleUrls: ['./release-notes-content.component.scss'],
	template: `
		<div
			class="parsed-text"
			[innerHTML]="safeHtml"
			(mouseover)="onMouseOver($event)"
			(mouseout)="onMouseOut($event)"
			(mouseleave)="hideTooltip()"
		></div>
		<div class="card-tooltip-container" *ngIf="activeCardId" [ngStyle]="tooltipStyle">
			<card-tooltip
				[cardId]="activeCardId"
				[localized]="true"
				[relativePosition]="tooltipPosition"
			></card-tooltip>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReleaseNotesContentComponent implements OnDestroy {
	@Input() set html(value: unknown) {
		const text = typeof value === 'string' ? value : '';
		this.safeHtml = this.sanitizer.bypassSecurityTrustHtml(text);
		this.hideTooltip();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}

	safeHtml: SafeHtml = '';
	activeCardId: string | null;
	tooltipStyle: Record<string, string> = {};
	tooltipPosition: 'left' | 'right' = 'right';

	constructor(
		private readonly sanitizer: DomSanitizer,
		private readonly cdr: ChangeDetectorRef,
	) {}

	ngOnDestroy(): void {
		this.hideTooltip();
	}

	onMouseOver(event: MouseEvent): void {
		if (event.shiftKey) {
			return;
		}

		const cardElement = this.findCardElement(event.target);
		if (!cardElement) {
			return;
		}

		const cardId = cardElement.getAttribute('data-card-id');
		if (!cardId) {
			return;
		}

		if (cardId === this.activeCardId) {
			return;
		}

		this.showTooltip(cardElement, cardId);
	}

	onMouseOut(event: MouseEvent): void {
		if (event.shiftKey) {
			return;
		}

		const fromCard = this.findCardElement(event.target);
		if (!fromCard) {
			return;
		}

		const toCard = this.findCardElement(event.relatedTarget);
		if (toCard) {
			return;
		}

		this.hideTooltip();
	}

	private showTooltip(cardElement: HTMLElement, cardId: string): void {
		const rect = cardElement.getBoundingClientRect();
		const showOnRight = rect.left < window.innerWidth / 2;
		this.tooltipPosition = showOnRight ? 'right' : 'left';
		this.tooltipStyle = {
			top: `${rect.top + rect.height / 2}px`,
			left: showOnRight ? `${rect.right + 8}px` : `${rect.left - 8}px`,
			transform: 'translateY(-50%)',
		};
		this.activeCardId = cardId;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}

	hideTooltip(): void {
		this.activeCardId = null;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}

	private findCardElement(target: EventTarget | null): HTMLElement | null {
		if (!(target instanceof HTMLElement)) {
			return null;
		}
		return target.closest('.release-notes-card') as HTMLElement | null;
	}
}
