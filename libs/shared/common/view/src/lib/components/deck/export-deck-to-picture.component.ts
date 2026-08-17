import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Inject,
	Input,
	Optional,
	ViewChild,
	ViewRef,
} from '@angular/core';
import { Sideboard, decode } from '@firestone-hs/deckstrings';
import { groupByFunction2, sleep, sortByProperties } from '@firestone/shared/framework/common';
import type { IOwUtilsService } from '@firestone/shared/framework/core';
import {
	AnalyticsService,
	CardsFacadeService,
	ILocalizationService,
	OW_UTILS_SERVICE_TOKEN,
} from '@firestone/shared/framework/core';
import domtoimage from 'dom-to-image-more';

@Component({
	standalone: false,
	selector: 'export-deck-to-picture',
	styleUrls: ['./export-deck-to-picture.component.scss'],
	template: `
		<div
			class="export-deck-to-picture"
			(mousedown)="takeScreenshot($event)"
			[helpTooltip]="showTooltip ? tooltip : null"
		>
			<div class="icon" inlineSVG="assets/svg/social/clipboard.svg"></div>
			<div class="message" *ngIf="statusText || ((!showTooltip || title) && (copyText || title))">
				{{ statusText || copyText || title }}
			</div>
		</div>
		<div class="export-capture" #captureRoot *ngIf="showCapture">
			<div class="deck-name" *ngIf="deckName">{{ deckName }}</div>
			<ul class="cards">
				<li class="card-container" *ngFor="let card of cards">
					<card-tile class="card" [cardId]="card.cardId" [numberOfCopies]="card.quantity"></card-tile>
					<div class="sideboard" *ngIf="card.sideboard?.length">
						<card-tile
							*ngFor="let sideboard of card.sideboard"
							class="card"
							[cardId]="sideboard.cardId"
							[numberOfCopies]="sideboard.quantity"
						></card-tile>
					</div>
				</li>
			</ul>
			<div class="footer">
				<div class="dust">
					<div class="dust-icon" inlineSVG="assets/svg/rewards/reward_dust.svg"></div>
					<div class="dust-amount">{{ dustCost }}</div>
				</div>
				<div class="brand">
					<div class="logo" inlineSVG="assets/svg/firestone_logo_no_text.svg"></div>
					<div class="brand-name">Firestone</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExportDeckToPictureComponent {
	@ViewChild('captureRoot') captureRoot: ElementRef<HTMLElement>;

	@Input() copyText: string | null;
	@Input() showTooltip: boolean;
	@Input() title: string;
	@Input() origin: string = 'deck-list';
	@Input() deckName: string;
	@Input() set cardsList(value: readonly string[]) {
		this._cardsList = value;
		this.rebuildCards();
	}
	@Input() set deckstring(value: string) {
		this._deckstring = value;
		this.rebuildCards();
	}

	cards: readonly CaptureCard[] = [];
	dustCost = 0;
	showCapture = false;
	statusText: string | null = null;
	tooltip: string;

	private _deckstring: string;
	private _cardsList: readonly string[];
	private isScreenshotInProgress = false;

	constructor(
		private readonly cdr: ChangeDetectorRef,
		private readonly analytics: AnalyticsService,
		private readonly i18n: ILocalizationService,
		private readonly allCards: CardsFacadeService,
		@Optional() @Inject(OW_UTILS_SERVICE_TOKEN) private readonly owUtils: IOwUtilsService | null,
	) {
		this.tooltip = this.i18n.translateString('app.decktracker.deck-details.export-deck-picture-tooltip');
	}

	async takeScreenshot(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		if (this.isScreenshotInProgress) {
			return;
		}
		if (!this.cards.length) {
			console.error('[export-deck-to-picture] No cards to export');
			return;
		}

		this.isScreenshotInProgress = true;
		this.statusText = this.i18n.translateString('app.decktracker.deck-details.export-deck-picture-working');
		this.tooltip = this.statusText;
		this.showCapture = true;
		this.analytics.trackEvent('screenshot', { origin: this.origin });
		this.markForCheck();

		const messageTimeout = setTimeout(() => {
			this.statusText = this.i18n.translateString(
				'app.decktracker.deck-details.export-deck-picture-still-working',
			);
			this.tooltip = this.statusText;
			this.markForCheck();
		}, 4000);

		try {
			await sleep(100);
			const captureElement = this.captureRoot?.nativeElement;
			if (!captureElement) {
				throw new Error('Capture element not found');
			}
			await this.waitForImages(captureElement);

			const computedStyles = getComputedStyle(document.documentElement);
			const backgroundImage = computedStyles.getPropertyValue('--window-background-image');
			const scale = 4;
			const dataUrl: string = await domtoimage.toJpeg(captureElement, {
				width: scale * captureElement.scrollWidth,
				height: scale * (captureElement.scrollHeight + 20),
				style: {
					'padding-top': '10px',
					'background-color': '#090a0d',
					'background-size': 'cover',
					'background-image': backgroundImage,
					transform: `scale(${scale})`,
					'transform-origin': 'top left',
				},
			});
			if (!dataUrl?.startsWith('data:image/')) {
				throw new Error('Invalid data URL format');
			}
			await this.copyImageToClipboard(dataUrl);
			this.statusText = this.i18n.translateString('app.decktracker.deck-details.export-deck-picture-copied');
			this.tooltip = this.i18n.translateString('app.decktracker.deck-details.export-deck-picture-copied-tooltip');
			this.markForCheck();
			await sleep(3000);
		} catch (error) {
			console.error('[export-deck-to-picture] Screenshot failed:', error);
			this.statusText = this.i18n.translateString('app.decktracker.deck-details.export-deck-picture-failed');
			this.tooltip = this.i18n.translateString('app.decktracker.deck-details.export-deck-picture-tooltip');
			this.markForCheck();
			await sleep(3000);
		} finally {
			clearTimeout(messageTimeout);
			this.showCapture = false;
			this.statusText = null;
			this.tooltip = this.i18n.translateString('app.decktracker.deck-details.export-deck-picture-tooltip');
			this.isScreenshotInProgress = false;
			this.markForCheck();
		}
	}

	private async copyImageToClipboard(dataUrl: string): Promise<void> {
		if (this.owUtils) {
			await this.owUtils.copyImageDataUrlToClipboard(dataUrl);
			return;
		}
		const blob = await (await fetch(dataUrl)).blob();
		await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
	}

	private rebuildCards() {
		if (this._deckstring?.length) {
			this.cards = this.buildCardsFromDeckstring(this._deckstring);
		} else if (this._cardsList?.length) {
			this.cards = this.buildCardsFromCardIds(this._cardsList);
		} else {
			this.cards = [];
		}
		this.dustCost = computeDustCost(this.cards, this.allCards);
	}

	private buildCardsFromDeckstring(deckstring: string): readonly CaptureCard[] {
		try {
			const decklist = decode(deckstring);
			return decklist.cards
				.map((pair) => {
					const cardDbfId = pair[0];
					const quantity = pair[1];
					const card = this.allCards.getCard(cardDbfId);
					const sideboardFromList = decklist.sideboards?.find((s) => s.keyCardDbfId === cardDbfId);
					return {
						cardId: card.id,
						name: card.name,
						cost: card.cost,
						quantity: quantity,
						sideboard: this.buildMinimalSideboard(sideboardFromList),
					};
				})
				.sort(sortByProperties((c: CaptureCard) => [c.cost, c.name]));
		} catch (e) {
			console.error('[export-deck-to-picture] could not decode deckstring', deckstring, e);
			return [];
		}
	}

	private buildCardsFromCardIds(cardsList: readonly string[]): readonly CaptureCard[] {
		const groupedById = groupByFunction2(
			cardsList.filter((c) => !!c),
			(cardId: string) => cardId,
		);
		return Object.values(groupedById)
			.map((cards) => {
				const card = this.allCards.getCard(cards[0]);
				return {
					cardId: card.id,
					name: card.name,
					cost: card.cost,
					quantity: cards.length,
				};
			})
			.sort(sortByProperties((c: CaptureCard) => [c.cost, c.name]));
	}

	private buildMinimalSideboard(sideboardFromList: Sideboard | undefined): readonly CaptureCard[] {
		if (!sideboardFromList) {
			return [];
		}
		return sideboardFromList.cards.map((pair) => {
			const card = this.allCards.getCard(pair[0]);
			return {
				cardId: card.id,
				name: card.name,
				cost: card.cost,
				quantity: pair[1],
			};
		});
	}

	private async waitForImages(root: HTMLElement): Promise<void> {
		const images = Array.from(root.querySelectorAll('img'));
		await Promise.race([
			Promise.all(
				images.map((img) =>
					img.complete
						? Promise.resolve()
						: new Promise<void>((resolve) => {
								img.addEventListener('load', () => resolve(), { once: true });
								img.addEventListener('error', () => resolve(), { once: true });
							}),
				),
			),
			sleep(3000),
		]);
	}

	private markForCheck() {
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}

interface CaptureCard {
	readonly cardId: string;
	readonly name: string;
	readonly cost: number;
	readonly quantity: number;
	readonly sideboard?: readonly CaptureCard[];
}

const computeDustCost = (cards: readonly CaptureCard[], allCards: CardsFacadeService): number => {
	return cards.reduce((total, card) => {
		const sideboardCost = card.sideboard?.length ? computeDustCost(card.sideboard, allCards) : 0;
		return total + dustToCraftFor(allCards.getCard(card.cardId)?.rarity) * card.quantity + sideboardCost;
	}, 0);
};

const dustToCraftFor = (rarity: string | undefined): number => {
	switch (rarity?.toLowerCase()) {
		case 'legendary':
			return 1600;
		case 'epic':
			return 400;
		case 'rare':
			return 100;
		case 'common':
			return 40;
		default:
			return 0;
	}
};
