import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, Optional, ViewRef } from '@angular/core';
import { DeckDefinition, decode, encode } from '@firestone-hs/deckstrings';
import {
	AnalyticsService,
	CardsFacadeService,
	ILocalizationService,
	OverwolfService,
} from '@firestone/shared/framework/core';

@Component({
	selector: 'copy-deckstring',
	styleUrls: ['./copy-deckstring.component.scss'],
	template: `
		<div
			class="copy-deckstring"
			(mousedown)="copyDeckstring()"
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
	@Input() copyText: string;
	@Input() showTooltip: boolean;
	@Input() title: string;
	@Input() origin: string;
	@Input() deckName: string;

	@Input() set deckstring(value: string) {
		this._deckstring = value;
		console.debug('set deckstring', value);
		if (!!value) {
			try {
				const deckDefinition = decode(value);
				const updatedDeckDefinition = sanitizeDeckDefinition(deckDefinition, this.allCards);
				this.normalizedDeckstring = encode(updatedDeckDefinition);
				console.debug('deckDefinition', deckDefinition, updatedDeckDefinition, this.normalizedDeckstring);
			} catch (e) {
				console.error('could not decode deckstring', value, e);
			}
		}
	}

	private _deckstring: string;
	private normalizedDeckstring: string;
	private inputCopy: string;

	constructor(
		private readonly cdr: ChangeDetectorRef,
		@Optional() private readonly ow: OverwolfService,
		private readonly i18n: ILocalizationService,
		private readonly allCards: CardsFacadeService,
		private readonly analytics: AnalyticsService,
	) {}

	async copyDeckstring() {
		if (!this.ow?.isOwEnabled()) {
			console.log('no OW service present, not copying to clipboard');
			return;
		}
		let copiedString = this.normalizedDeckstring;
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
}

export const sanitizeDeckstring = (deckstring: string, allCards: CardsFacadeService): string => {
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
