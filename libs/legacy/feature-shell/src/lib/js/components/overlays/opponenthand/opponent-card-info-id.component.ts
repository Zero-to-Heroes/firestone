import { ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { CardIds } from '@firestone-hs/reference-data';
import { DeckCard, GuessedInfo } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { publicCardCreators } from '../../../services/hs-utils';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';

@Component({
	selector: 'opponent-card-info-id',
	styleUrls: ['../../../../css/component/overlays/opponenthand/opponent-card-info-id.component.scss'],
	template: `
		<div
			class="opponent-card-info-id"
			*ngIf="(hasBuffs && displayBuff) || (cardId && displayGuess) || forged"
			cardTooltip
			[cardTooltipCard]="_card"
			cardTooltipPosition="bottom-right"
			[cardTooltipDisplayBuffs]="displayBuff"
			[cardTooltipAdditionalInfo]="guessedInfo"
			[ngClass]="{ buffed: hasBuffs }"
		>
			<img *ngIf="cardUrl" [src]="cardUrl" class="card-image" (error)="handleMissingImage($event)" />
			<img
				*ngIf="forged && !cardUrl"
				src="https://static.zerotoheroes.com/hearthstone/asset/firestone/images/tracker/forged.webp"
				class="card-image forged"
			/>
			<div *ngIf="hasBuffs && !forged && !cardUrl" class="only-buff">
				<svg>
					<use xlink:href="assets/svg/sprite.svg#card_only_buff" />
				</svg>
			</div>

			<div *ngIf="forged && cardUrl" class="card-image forged icon" inlineSVG="assets/svg/forged.svg"></div>
			<div *ngIf="drawnBy" class="drawn">
				<svg>
					<use xlink:href="assets/svg/sprite.svg#created_by" />
				</svg>
			</div>
			<div *ngIf="createdBy" class="created-by" inlineSVG="assets/svg/gift_inside_circle.svg"></div>
		</div>
	`,
})
export class OpponentCardInfoIdComponent {
	// componentType: ComponentType<CardInHandGuessedInfoTooltipComponent> = CardInHandGuessedInfoTooltipComponent;

	cardId: string;
	cardUrl: string;
	createdBy: boolean;
	drawnBy: boolean;
	forged: boolean;
	hasBuffs: boolean;
	guessedInfo: GuessedInfo;
	_card: DeckCard;

	@Input() displayGuess: boolean;
	@Input() displayBuff: boolean;

	@Input() set card(value: DeckCard) {
		// console.debug('setting card', value, value.lastAffectedByCardId || value.creatorCardId);
		// Keep the || to handle empty card id
		const realCardId = this.normalizeEnchantment(value.cardId, value.lastAffectedByCardId || value.creatorCardId);
		// console.debug('realCardId', realCardId);
		// const hasCreatorInfo = lastAffectedByCardId && !value.cardId;
		this.createdBy = !value.cardId && !!value.creatorCardId;
		this.drawnBy =
			!value.cardId &&
			!!value.lastAffectedByCardId &&
			// Issue: if a card is "created by" something in deck, then drawn by a tutor, it won't show any information,
			// which will in itself give a hint
			// !value.creatorCardId &&
			// This might reduce the risk of this issue appearing
			!this.createdBy &&
			publicCardCreators.includes(value.lastAffectedByCardId as CardIds);
		this.hasBuffs = value.buffCardIds?.length > 0;
		this.forged = value.forged > 0;

		this.cardId =
			realCardId || (this.createdBy && value.creatorCardId) || (this.drawnBy && value.lastAffectedByCardId);
		// console.debug(
		// 	'this.cardId',
		// 	this.cardId,
		// 	realCardId,
		// 	this.createdBy,
		// 	value.creatorCardId,
		// 	this.drawnBy,
		// 	value.lastAffectedByCardId,
		// );
		this.cardUrl = this.cardId
			? `https://static.zerotoheroes.com/hearthstone/cardart/256x/${this.cardId}.jpg`
			: undefined;
		this._card = value.update({
			cardId: this.cardId,
			// We probably don't need to update the other fields, as they are not displayed
			cardName: this.cardId === value.cardId ? value.cardName : this.i18n.getCardName(this.cardId),
		} as DeckCard);
		this.guessedInfo = value.guessedInfo;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	constructor(
		private readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly allCards: CardsFacadeService,
	) {}

	handleMissingImage(event: Event) {
		console.warn('missing image', this.cardId, this.cardUrl, this.createdBy, this.drawnBy);
	}

	// In some cases, it's an enchantment that creates the card. And while we want to keep that
	// info in our internal model that reflects the actual game state, it's better to show the
	// user the actual card
	private normalizeEnchantment(cardId: string, creatorCardId: string): string {
		// console.debug('normalizing enchantment', cardId, 'creator', creatorCardId);
		if (!!cardId?.length) {
			return cardId;
		}

		// Only try to normalize enchantments
		if (this.allCards.getCard(creatorCardId).type !== 'Enchantment') {
			return creatorCardId;
		}

		// Manual exceptions
		// Probably useless now that we have the regex
		switch (creatorCardId) {
			case CardIds.DrawOffensivePlayTavernBrawlEnchantment:
				return CardIds.OffensivePlayTavernBrawl;
			case CardIds.SecretPassage_SecretEntranceEnchantment:
			case CardIds.SecretPassage_SecretExitEnchantment:
			case CardIds.SecretPassage_SecretPassagePlayerEnchantment:
				return CardIds.SecretPassage;
			case CardIds.CloakOfEmeraldDreams_CloakOfEmeraldDreamsTavernBrawlEnchantment:
				return CardIds.CloakOfEmeraldDreamsTavernBrawl;
			case CardIds.DivineIllumination_DivineIlluminationTavernBrawlEnchantment:
				return CardIds.DivineIlluminationTavernBrawl;
			case CardIds.Melomania_MelomaniaEnchantment:
				return CardIds.Melomania;
			case CardIds.RunicHelm_RunicHelmTavernBrawlEnchantment:
				return CardIds.RunicHelmTavernBrawl;
			case CardIds.RingOfPhaseshifting_PhaseshiftedTavernBrawlEnchantment:
				return CardIds.RingOfPhaseshiftingTavernBrawl;
			case CardIds.AnomalyLootFilled_LootFilledDummy:
				return CardIds.AnomalyLootFilled;
		}

		// The base case
		const regex = /(.*)e\d*$/;
		const match = regex.exec(creatorCardId);
		// console.debug('going into regex ', creatorCardId, match, regex);
		if (!!match) {
			const rootCardId = match[1];
			return rootCardId;
		}
		console.warn('unhandled enchantment', creatorCardId);
		return creatorCardId;
	}
}
