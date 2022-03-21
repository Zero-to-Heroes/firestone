import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, Optional, ViewRef } from '@angular/core';
import { CardsFacadeService } from '@services/cards-facade.service';
import { normalizeDeckHeroDbfId } from '@services/hs-utils';
import { decode, encode } from 'deckstrings';
import { LocalizationFacadeService } from '../../services/localization-facade.service';
import { OverwolfService } from '../../services/overwolf.service';

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
		</div>
		<div class="message" *ngIf="!showTooltip || title">{{ copyText || title }}</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CopyDesckstringComponent {
	@Input() copyText: string;
	@Input() showTooltip: boolean;
	@Input() title: string;

	@Input() set deckstring(value: string) {
		this._deckstring = value;
		if (!!value) {
			try {
				const deckDefinition = decode(value);
				deckDefinition.heroes = deckDefinition.heroes.map((hero) =>
					normalizeDeckHeroDbfId(hero, this.allCards),
				);
				this.normalizedDeckstring = encode(deckDefinition);
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
	}
}
