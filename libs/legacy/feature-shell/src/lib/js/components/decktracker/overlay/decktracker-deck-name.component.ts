import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, Optional, ViewRef } from '@angular/core';
import { CardTooltipPositionType } from '../../../directives/card-tooltip-position.type';
import { DeckState } from '../../../models/decktracker/deck-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { OverwolfService } from '../../../services/overwolf.service';

@Component({
	selector: 'decktracker-deck-name',
	styleUrls: ['../../../../css/component/decktracker/overlay/decktracker-deck-name.component.scss'],
	template: `
		<div class="deck-name">
			<span class="name" [helpTooltip]="deckName" [bindTooltipToGameWindow]="true">{{ deckName }}</span>
			<copy-deckstring
				*ngIf="deckstring && !missingInitialDeckstring"
				[deckstring]="deckstring"
				[copyText]="copyText"
				[showTooltip]="true"
			>
			</copy-deckstring>
			<import-deckstring
				*ngIf="!deckstring || missingInitialDeckstring"
				[side]="side"
				[tooltipPosition]="_tooltipPosition"
			>
			</import-deckstring>
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

	@Input() set tooltipPosition(value: CardTooltipPositionType) {
		this._tooltipPosition = value;
	}

	@Input() set deck(value: DeckState) {
		if (!value) {
			return;
		}

		this.deckName =
			value.name ||
			(value.hero
				? this.i18n.translateString(`decktracker.deck-name.player-name`, {
						playerName: value.hero.playerName || value.hero.name,
						playerClass: this.i18n.translateString(`global.class.${value.hero.playerClass}`),
				  })
				: this.i18n.translateString('decktracker.deck-name.unnamed-deck'));
		this.deckstring = value.deckstring;
		this.copyText = this.i18n.translateString('decktracker.deck-name.copy-deckstring-label');
		this.side = value.isOpponent ? 'opponent' : 'player';
		if (this.missingInitialDeckstring === undefined) {
			this.missingInitialDeckstring = this.deckstring == null;
		}
	}

	constructor(
		private readonly cdr: ChangeDetectorRef,
		@Optional() private readonly ow: OverwolfService,
		private i18n: LocalizationFacadeService,
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
}
