import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, Optional, ViewRef } from '@angular/core';
import { DeckDefinition, DeckList, decode, encode, FormatType } from '@firestone-hs/deckstrings';
import { GameFormat, getDefaultHeroDbfIdForClass } from '@firestone-hs/reference-data';
import { groupByFunction2 } from '@firestone/shared/framework/common';
import {
	AnalyticsService,
	CardsFacadeService,
	ILocalizationService,
	OverwolfService,
} from '@firestone/shared/framework/core';

@Component({
	standalone: false,
	selector: 'copy-deckstring',
	styleUrls: ['./copy-deckstring.component.scss'],
	template: `
		<div
			class="copy-deckstring"
			(mousedown)="copyDeckstring($event)"
			[helpTooltip]="showTooltip ? copyText : null"
			[bindTooltipToGameWindow]="showTooltip ? true : null"
		>
			<div class="icon" inlineSVG="assets/svg/copy.svg"></div>
			<div class="message" *ngIf="!showTooltip || title">{{ copyText || title }}</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CopyDesckstringComponent {
	@Input() copyText: string | null;
	@Input() showTooltip: boolean;
	@Input() title: string;
	@Input() origin: string;
	@Input() deckName: string;
	@Input() cardsList: readonly string[];

	@Input() set deckstring(value: string) {
		this._deckstring = value;
		// console.debug('set deckstring', value);
		if (!!value) {
			try {
				const deckDefinition = decode(value);
				const updatedDeckDefinition = sanitizeDeckDefinition(deckDefinition, this.allCards);
				this.normalizedDeckstring = encode(updatedDeckDefinition);
				// console.debug('deckDefinition', deckDefinition, updatedDeckDefinition, this.normalizedDeckstring);
			} catch (e) {
				console.error('could not decode deckstring', value, e);
			}
		}
	}

	private _deckstring: string;
	private normalizedDeckstring: string;
	private inputCopy: string | null;

	constructor(
		private readonly cdr: ChangeDetectorRef,
		@Optional() private readonly ow: OverwolfService,
		private readonly i18n: ILocalizationService,
		private readonly allCards: CardsFacadeService,
		private readonly analytics: AnalyticsService,
	) {}

	async copyDeckstring(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();

		let deducedDeckstring = null;
		if (!this.deckstring?.length && this.cardsList?.length) {
			deducedDeckstring = buildCurrentDeckstring(this.cardsList, GameFormat.FT_STANDARD, this.allCards);
		}

		if (!this.ow?.isOwEnabled()) {
			console.log('no OW service present, copying with browser API');
			this.copyDeckstringWithoutOverwolf();
			return;
		}
		let copiedString = deducedDeckstring ?? this.normalizedDeckstring;
		if (this.deckName) {
			copiedString = '### ' + this.deckName + '\n' + copiedString;
		}
		this.ow.placeOnClipboard(copiedString);
		this.inputCopy = this.title || this.copyText;
		this.copyText = this.i18n.translateString('decktracker.deck-name.copy-deckstring-confirmation');
		console.log('copied deckstring to clipboard', copiedString, this._deckstring);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
		setTimeout(() => {
			this.copyText = this.title ? null : this.inputCopy;
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		}, 2000);
		this.analytics.trackEvent('copy-deckstring', { origin: this.origin });
	}

	private async copyDeckstringWithoutOverwolf() {
		console.debug('navigator.userAgent', navigator.userAgent);

		// Try modern clipboard API first
		if (navigator.clipboard && navigator.clipboard.writeText) {
			try {
				await navigator.clipboard.writeText(this.normalizedDeckstring);
				this.copyDone();
				return;
			} catch (err) {
				console.warn('Modern clipboard API failed, falling back to execCommand', err);
			}
		}

		// Fallback to legacy execCommand approach
		let worked = false;
		const listener = (e: ClipboardEvent) => {
			const clipboardData = e.clipboardData;
			if (clipboardData) {
				clipboardData.setData('text/plain', this.normalizedDeckstring);
				worked = true;
				e.preventDefault();
			}
		};

		document.addEventListener('copy', listener);
		try {
			document.execCommand('copy');
		} finally {
			document.removeEventListener('copy', listener);
		}

		if (worked) {
			this.copyDone();
		}
	}

	private copyDone() {
		this.inputCopy = this.title || this.copyText;
		this.copyText = this.i18n.translateString('decktracker.deck-name.copy-deckstring-confirmation');
		console.debug('copied deckstring to clipboard', this._deckstring);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
		setTimeout(() => {
			this.copyText = this.title ? null : this.inputCopy;
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		}, 2000);
	}
}

export const sanitizeDeckstring = (deckstring: string, allCards: CardsFacadeService): string | null => {
	if (!deckstring?.length) {
		return null;
	}
	const deckDefinition = decode(deckstring);
	const updatedDeckDefinition = sanitizeDeckDefinition(deckDefinition, allCards);
	return encode(updatedDeckDefinition);
};

export const sanitizeDeckDefinition = (
	deckDefinition: DeckDefinition,
	allCards: CardsFacadeService,
): DeckDefinition => {
	return deckDefinition;
};

const buildCurrentDeckstring = (
	cardsList: readonly string[],
	gameFormat: GameFormat,
	allCards: CardsFacadeService,
): string | null => {
	const deckDefinition = buildDeckDefinitionFromCardsList(cardsList, gameFormat, allCards);
	if (!deckDefinition) {
		return null;
	}
	const updatedDeckDefinition = sanitizeDeckDefinition(deckDefinition, allCards);
	return encode(updatedDeckDefinition);
};

const buildDeckDefinitionFromCardsList = (
	cardsList: readonly string[],
	gameFormat: GameFormat,
	allCards: CardsFacadeService,
): DeckDefinition | null => {
	cardsList = cardsList.filter((c) => !!c);
	if (!cardsList.length) {
		return null;
	}
	const groupedById = groupByFunction2(cardsList, (cardId: string) => cardId);
	const cardPairs: DeckList = Object.values(groupedById).map((cards) => [
		allCards.getCard(cards[0]).dbfId,
		cards.length,
	]);
	const groupedByPlayerClass = groupByFunction2(cardsList, (cardId: string) => allCards.getCard(cardId).playerClass);
	// Take the one with the most cards
	const deducedPlayerClass = Object.keys(groupedByPlayerClass).sort(
		(a, b) => groupedByPlayerClass[b].length - groupedByPlayerClass[a].length,
	)[0];
	const deckDefinition: DeckDefinition = {
		cards: cardPairs,
		heroes: [getDefaultHeroDbfIdForClass(deducedPlayerClass)],
		format: gameFormat as FormatType,
	};
	return deckDefinition;
};
