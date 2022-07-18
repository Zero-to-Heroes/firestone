import { ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@services/cards-facade.service';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { publicCardEye } from '../../../services/hs-utils';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';

@Component({
	selector: 'opponent-card-info-id',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		'../../../../css/component/overlays/opponenthand/opponent-card-info-id.component.scss',
	],
	template: `
		<div
			class="opponent-card-info-id"
			*ngIf="(hasBuffs && displayBuff) || (cardId && displayGuess)"
			cardTooltip
			[cardTooltipCard]="_card"
			cardTooltipPosition="bottom-right"
			[cardTooltipDisplayBuffs]="displayBuff"
			[ngClass]="{ 'buffed': hasBuffs }"
		>
			<img *ngIf="cardUrl" [src]="cardUrl" class="card-image" />
			<div *ngIf="createdBy" class="created-by" inlineSVG="assets/svg/gift_inside_circle.svg"></div>
			<div *ngIf="drawnBy" class="drawn">
				<svg>
					<use xlink:href="assets/svg/sprite.svg#created_by" />
				</svg>
			</div>
			<div *ngIf="!cardUrl" class="only-buff">
				<svg>
					<use xlink:href="assets/svg/sprite.svg#card_only_buff" />
				</svg>
			</div>
		</div>
	`,
})
export class OpponentCardInfoIdComponent {
	cardId: string;
	cardUrl: string;
	createdBy: boolean;
	drawnBy: boolean;
	hasBuffs: boolean;
	_card: DeckCard;

	@Input() displayGuess: boolean;
	@Input() displayBuff: boolean;

	@Input() set card(value: DeckCard) {
		const lastAffectedByCardId = value.creatorCardId ?? value.lastAffectedByCardId;
		this.cardId = this.normalizeEnchantment(value.cardId ?? lastAffectedByCardId);
		this._card = value.update({
			cardId: this.cardId,
			// We probably don't need to update the other fields, as they are not displayed
			cardName: this.cardId === value.cardId ? value.cardName : this.i18n.getCardName(this.cardId),
		} as DeckCard);
		this.cardUrl = this.cardId
			? `https://static.zerotoheroes.com/hearthstone/cardart/256x/${this.cardId}.jpg`
			: undefined;
		const hasCreatorInfo = lastAffectedByCardId && !value.cardId;
		this.createdBy = hasCreatorInfo && !publicCardEye.includes(lastAffectedByCardId as CardIds);
		this.drawnBy = hasCreatorInfo && !this.createdBy;
		this.hasBuffs = value.buffCardIds?.length > 0;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	constructor(
		private readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly allCards: CardsFacadeService,
	) {}

	// In some cases, it's an enchantment that creates the card. And while we want to keep that
	// info in our internal model that reflects the actual game state, it's better to show the
	// user the actual card
	private normalizeEnchantment(cardId: string): string {
		const card = this.allCards.getCard(cardId);
		if (card.type !== 'Enchantment') {
			return cardId;
		}

		// Manual exceptions
		switch (cardId) {
			case CardIds.DrawOffensivePlayTavernBrawlEnchantment:
				return CardIds.OffensivePlayTavernBrawl;
		}

		// The base case
		const match = /(.*)e\d+?/.exec(cardId);
		if (!!match) {
			const rootCardId = match[1];
			return rootCardId;
		}
		console.warn('unhandled enchantment', cardId);
		return cardId;
	}
}
