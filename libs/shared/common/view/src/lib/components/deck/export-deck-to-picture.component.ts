import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { sleep } from '@firestone/shared/framework/common';
import { AnalyticsService, OverwolfService, OwUtilsService } from '@firestone/shared/framework/core';
import domtoimage from 'dom-to-image-more';
import { BehaviorSubject, Observable } from 'rxjs';

@Component({
	standalone: false,
	selector: 'export-deck-to-picture',
	styleUrls: ['./export-deck-to-picture.component.scss'],
	template: `
		<div class="export-deck-to-picture">
			<div class="screenshot-text" *ngIf="screenshotText$ | async as text">{{ text }}</div>
			<div class="screenshot-button" (click)="takeScreenshot()">
				<div
					class="icon"
					inlineSVG="assets/svg/social/clipboard.svg"
					[helpTooltip]="screenshotTooltip$ | async"
				></div>
				<div class="message" *ngIf="buttonText">{{ buttonText }}</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExportDeckToPictureComponent {
	screenshotText$: Observable<string>;
	screenshotTooltip$: Observable<string>;

	@Input() selector: string; // CSS selector for the element to capture
	@Input() buttonText: string | null = null; // Optional button text
	@Input() origin: string = 'deck-list'; // Analytics origin

	private screenshotText$$ = new BehaviorSubject<string>(null);
	private screenshotTooltip$$ = new BehaviorSubject<string>('Copy deck list as image to clipboard');
	private isScreenshotInProgress = false;

	constructor(
		private readonly cdr: ChangeDetectorRef,
		private readonly analytics: AnalyticsService,
		private readonly ow: OverwolfService,
		private readonly owUtils: OwUtilsService,
	) {
		this.screenshotText$ = this.screenshotText$$.asObservable();
		this.screenshotTooltip$ = this.screenshotTooltip$$.asObservable();
	}

	async takeScreenshot() {
		// Prevent concurrent screenshot operations
		if (this.isScreenshotInProgress) {
			return;
		}

		if (!this.selector) {
			console.error('[export-deck-to-picture] No selector provided');
			return;
		}

		const captureElement: HTMLElement = document.querySelector(this.selector);
		if (!captureElement) {
			console.error('[export-deck-to-picture] Could not find element with selector:', this.selector);
			return;
		}

		this.isScreenshotInProgress = true;
		this.screenshotText$$.next('Taking high-res screenshot...');
		this.screenshotTooltip$$.next('It can take a few seconds, thanks for waiting :)');
		this.analytics.trackEvent('screenshot', { origin: this.origin });
		await sleep(100);

		const computedStyles = getComputedStyle(captureElement);
		const backgroundImage = computedStyles.getPropertyValue('--window-background-image');

		const messageTimeout = setTimeout(() => {
			this.screenshotText$$.next('Still working...');
		}, 4000);

		const scale = 4;
		domtoimage
			.toJpeg(captureElement, {
				width: scale * captureElement.scrollWidth,
				height: scale * (captureElement.scrollHeight + 20),
				style: {
					'padding-top': '10px',
					'background-size': 'cover',
					'background-image': backgroundImage,
					transform: `scale(${scale})`,
					'transform-origin': 'top left',
				},
			})
			.then(async (dataUrl) => {
				await this.copyImageToClipboard(dataUrl);
				clearTimeout(messageTimeout);
				this.screenshotText$$.next('Copied to clipboard!');
				this.screenshotTooltip$$.next('You can now paste it to your favorite social network');
				await sleep(3000);
				this.screenshotText$$.next(null);
				this.screenshotTooltip$$.next('Copy deck list as image to clipboard');
				this.isScreenshotInProgress = false;
			})
			.catch((error) => {
				console.error('[export-deck-to-picture] Error taking screenshot:', error);
				clearTimeout(messageTimeout);
				this.screenshotText$$.next('Error taking screenshot');
				this.screenshotTooltip$$.next('Please try again');
				setTimeout(() => {
					this.screenshotText$$.next(null);
					this.screenshotTooltip$$.next('Copy deck list as image to clipboard');
					this.isScreenshotInProgress = false;
					if (!(this.cdr as ViewRef)?.destroyed) {
						this.cdr.detectChanges();
					}
				}, 3000);
			});
	}

	private async copyImageToClipboard(dataUrl: string): Promise<void> {
		// Validate dataUrl format
		if (!dataUrl || !dataUrl.startsWith('data:image/')) {
			throw new Error('Invalid data URL format');
		}

		if (this.ow.isOwEnabled()) {
			// Use OwUtils for Overwolf environment
			await this.owUtils.copyImageDataUrlToClipboard(dataUrl);
		} else {
			// Use browser clipboard API for web/other environments
			try {
				const blob = await (await fetch(dataUrl)).blob();
				const clipboardItem = new ClipboardItem({ [blob.type]: blob });
				await navigator.clipboard.write([clipboardItem]);
			} catch (error) {
				console.error('[export-deck-to-picture] Error copying to clipboard:', error);
				throw error;
			}
		}
	}
}
