import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, Optional, ViewRef } from '@angular/core';
import { sleep } from '@firestone/shared/framework/common';
import { AnalyticsService, OverwolfService, OwUtilsService } from '@firestone/shared/framework/core';
import domtoimage from 'dom-to-image-more';

@Component({
	standalone: false,
	selector: 'export-deck-image',
	styleUrls: ['./export-deck-image.component.scss'],
	template: `
		<div
			class="export-deck-image"
			(mousedown)="exportDeckToImage($event)"
			[helpTooltip]="currentTooltip"
			[bindTooltipToGameWindow]="true"
		>
			<div class="icon" inlineSVG="assets/svg/social/clipboard.svg"></div>
			<div class="message" *ngIf="showText">{{ currentText }}</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExportDeckImageComponent {
	@Input() captureElementSelector: string;
	@Input() showText = false;
	@Input() origin = 'deck-export';

	currentText: string;
	currentTooltip: string;

	private defaultTooltip = 'Copy deck image to clipboard';

	constructor(
		private readonly cdr: ChangeDetectorRef,
		@Optional() private readonly ow: OverwolfService,
		@Optional() private readonly owUtils: OwUtilsService,
		private readonly analytics: AnalyticsService,
	) {
		this.currentTooltip = this.defaultTooltip;
	}

	async exportDeckToImage(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();

		if (!this.captureElementSelector) {
			console.error('[export-deck-image] No capture element selector provided');
			return;
		}

		const captureElement: HTMLElement | null = document.querySelector(this.captureElementSelector);
		if (!captureElement) {
			console.error('[export-deck-image] Could not find element to capture:', this.captureElementSelector);
			return;
		}

		this.currentText = 'Taking screenshot...';
		this.currentTooltip = 'It can take a few seconds, thanks for waiting :)';
		this.detectChanges();

		this.analytics.trackEvent('export-deck-image', { origin: this.origin });

		await sleep(100);

		const computedStyles = getComputedStyle(captureElement);
		const backgroundImage = computedStyles.getPropertyValue('--window-background-image');

		const messageTimeout = setTimeout(() => {
			this.currentText = 'Still working...';
			this.detectChanges();
		}, 4000);

		try {
			const scale = 4;
			const dataUrl = await domtoimage.toJpeg(captureElement, {
				width: scale * captureElement.scrollWidth,
				height: scale * captureElement.scrollHeight,
				style: {
					'background-size': 'cover',
					'background-image': backgroundImage,
					transform: `scale(${scale})`,
					'transform-origin': 'top left',
				},
			});

			await this.copyImageToClipboard(dataUrl);

			clearTimeout(messageTimeout);
			this.currentText = 'Copied to clipboard!';
			this.currentTooltip = 'You can now paste it to your favorite social network';
			this.detectChanges();

			await sleep(3000);
			this.currentText = null;
			this.currentTooltip = this.defaultTooltip;
			this.detectChanges();
		} catch (e) {
			console.error('[export-deck-image] Error capturing image:', e);
			clearTimeout(messageTimeout);
			this.currentText = 'Error capturing image';
			this.currentTooltip = 'Something went wrong, please try again';
			this.detectChanges();

			await sleep(3000);
			this.currentText = null;
			this.currentTooltip = this.defaultTooltip;
			this.detectChanges();
		}
	}

	private async copyImageToClipboard(dataUrl: string): Promise<void> {
		// Use Overwolf utils if available (desktop app)
		if (this.owUtils) {
			await this.owUtils.copyImageDataUrlToClipboard(dataUrl);
			return;
		}

		// Fallback to browser Clipboard API (web)
		if (navigator.clipboard && 'write' in navigator.clipboard) {
			try {
				const response = await fetch(dataUrl);
				const blob = await response.blob();
				const clipboardItem = new ClipboardItem({ [blob.type]: blob });
				await navigator.clipboard.write([clipboardItem]);
				return;
			} catch (err) {
				console.warn('[export-deck-image] Clipboard API failed:', err);
			}
		}

		console.warn('[export-deck-image] No clipboard method available');
	}

	private detectChanges() {
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
