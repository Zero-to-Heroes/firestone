import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, Optional, ViewRef } from '@angular/core';
import { CardClass, GameFormat } from '@firestone-hs/reference-data';
import { DeckState, Metadata } from '@firestone/game-state';
import { CardTooltipPositionType } from '@firestone/shared/common/view';
import { CardsFacadeService, OverwolfService } from '@firestone/shared/framework/core';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';

@Component({
	standalone: false,
	selector: 'decktracker-deck-name',
	styleUrls: ['../../../../css/component/decktracker/overlay/decktracker-deck-name.component.scss'],
	template: `
		<div class="deck-name">
			<span class="name" [helpTooltip]="deckName" [bindTooltipToGameWindow]="true">{{ deckName }}</span>
			<import-deckstring *ngIf="missingInitialDeckstring" [side]="side" [tooltipPosition]="_tooltipPosition">
			</import-deckstring>
			<copy-deckstring
				[deckstring]="deckstring"
				[cardsList]="cardsList"
				[copyText]="copyText"
				[showTooltip]="true"
			>
			</copy-deckstring>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckTrackerDeckNameComponent {
	deckName: string;
	deckstring: string;
	copyText: string;
	_tooltipPosition: CardTooltipPositionType;
	missingInitialDeckstring: boolean;
	side: 'player' | 'opponent';
	cardsList: readonly string[];

	private _deck: DeckState;
	private _hideOpponentName: boolean;

	@Input() set tooltipPosition(value: CardTooltipPositionType) {
		this._tooltipPosition = value;
	}

	@Input() set hideOpponentName(value: boolean) {
		this._hideOpponentName = value;
		this.updateDeckName();
	}

	@Input() set deck(value: DeckState) {
		this._deck = value;
		this.deckstring = this._deck.deckstring;
		this.copyText = this.i18n.translateString('decktracker.deck-name.copy-deckstring-label');
		this.side = this._deck.isOpponent ? 'opponent' : 'player';
		if (this.missingInitialDeckstring === undefined) {
			this.missingInitialDeckstring = this._deck.deckstring == null;
		}
		if (this.missingInitialDeckstring) {
			this.cardsList = this._deck
				.getAllCardsFromStarterDeck()
				.map((c) => c.cardId)
				.filter((c) => c !== null);
		}
		this.updateDeckName();
	}

	constructor(
		private readonly cdr: ChangeDetectorRef,
		@Optional() private readonly ow: OverwolfService,
		private i18n: LocalizationFacadeService,
		private readonly allCards: CardsFacadeService,
	) {}

	async copyDeckstring() {
		if (!this.ow?.isOwEnabled()) {
			console.log('no OW service present, not copying to clipboard');
			return;
		}
		this.ow.placeOnClipboard(this.deckstring);
		this.copyText = this.i18n.translateString('decktracker.deck-name.copy-deckstring-confirmation');
		console.log('copied deckstring to clipboard', this.deckstring);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
		setTimeout(() => {
			this.copyText = this.i18n.translateString('decktracker.deck-name.copy-deckstring-label');
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		}, 2000);
	}

	private updateDeckName() {
		if (!this._deck) {
			return;
		}

		this.deckName =
			this._deck.name ||
			(this._deck.hero && !this._hideOpponentName
				? this.i18n.translateString(`decktracker.deck-name.player-name`, {
						playerName: this._deck.hero.playerName || this._deck.hero.name,
						playerClass: this.i18n.translateString(
							`global.class.${CardClass[
								this._deck.hero.classes?.[0] ?? CardClass.NEUTRAL
							].toLowerCase()}`,
						),
					})
				: this.i18n.translateString('decktracker.deck-name.unnamed-deck'));
	}
}
