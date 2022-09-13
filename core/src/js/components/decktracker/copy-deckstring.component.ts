import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, Optional, ViewRef } from '@angular/core';
import { DeckDefinition, decode, encode } from '@firestone-hs/deckstrings';
import { allDuelsSignatureTreasures, CardClass, CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@services/cards-facade.service';
import { normalizeDeckHeroDbfId } from '@services/hs-utils';
import { LocalizationFacadeService } from '../../services/localization-facade.service';
import { OverwolfService } from '../../services/overwolf.service';

declare let amplitude;

@Component({
	selector: 'copy-deckstring',
	styleUrls: [
		'../../../css/global/components-global.scss',
		'../../../css/component/decktracker/copy-deckstring.component.scss',
	],
	template: `
		<div
			class="copy-deckstring"
			(mousedown)="copyDeckstring()"
			[helpTooltip]="showTooltip ? copyText : null"
			[bindTooltipToGameWindow]="showTooltip ? true : null"
		>
			<svg class="svg-icon-fill">
				<use xlink:href="assets/svg/sprite.svg#copy_deckstring" />
			</svg>

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

	@Input() set deckstring(value: string) {
		this._deckstring = value;
		if (!!value) {
			try {
				const deckDefinition = decode(value);
				const updatedDeckDefinition = sanitizeDeckstring(deckDefinition, this.allCards);
				this.normalizedDeckstring = encode(updatedDeckDefinition);
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
		private readonly i18n: LocalizationFacadeService,
		private readonly allCards: CardsFacadeService,
	) {}

	async copyDeckstring() {
		if (!this.ow?.isOwEnabled()) {
			console.log('no OW service present, not copying to clipboard');
			return;
		}
		this.ow.placeOnClipboard(this.normalizedDeckstring);
		this.inputCopy = this.title || this.copyText;
		this.copyText = this.i18n.translateString('decktracker.deck-name.copy-deckstring-confirmation');
		console.log('copied deckstring to clipboard', this.normalizedDeckstring, this._deckstring);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
		setTimeout(() => {
			this.copyText = this.title ? null : this.inputCopy;
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		}, 2000);
		amplitude.getInstance().logEvent('copy-deckstring', { 'origin': this.origin });
	}
}

export const sanitizeDeckstring = (deckDefinition: DeckDefinition, allCards: CardsFacadeService): DeckDefinition => {
	// Filter for Duels - remove the signature treasure, as it breaks the HS deck builder
	const newCards = deckDefinition.cards.filter(([cardDbfId, quantity]) => {
		const card = allCards.getCardFromDbfId(cardDbfId);
		return !allDuelsSignatureTreasures.includes(card.id as CardIds);
	});
	const duelsSignatureTreasures = deckDefinition.cards
		.map(([cardDbfId, quantity]) => {
			const card = allCards.getCardFromDbfId(cardDbfId);
			return allDuelsSignatureTreasures.includes(card.id as CardIds) ? card : null;
		})
		.filter((card) => !!card);
	const duelsClass = !duelsSignatureTreasures?.length
		? null
		: duelsSignatureTreasures[0].classes?.length > 1
		? null
		: duelsSignatureTreasures[0].playerClass;
	const deckClass = deckDefinition.cards
		.map(([dbfId, quantity]) => allCards.getCardFromDbfId(dbfId))
		.map((card) => card?.cardClass)
		.filter((cardClass) => !!cardClass)
		.map((cardClass) => CardClass[cardClass.toUpperCase()] as CardClass)
		.filter((cardClass: CardClass) => cardClass !== CardClass.NEUTRAL)[0];
	// console.debug('sanitize deck defnition', deckDefinition, duelsClass, deckClass);
	deckDefinition.heroes = deckDefinition.heroes.map((hero) => {
		// In case it's a duels deck, we need to use the base class hero, instead of the neutral variation
		const result = normalizeDeckHeroDbfId(hero, allCards, duelsClass, deckClass) ?? 7;
		return result;
	});
	deckDefinition.cards = newCards;
	// console.debug('after sanitize', deckDefinition);
	return deckDefinition;
};
