/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { AfterContentInit, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { CardClass, CardIds } from '@firestone-hs/reference-data';
import { DeckCard, DeckState, getPossibleForgedCards, GuessedInfo, Metadata } from '@firestone/game-state';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { BehaviorSubject, combineLatest, filter } from 'rxjs';
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
			[cardTooltipRelatedCardIds]="possibleCards"
			[cardTooltipRelatedCardIdsHeader]="'decktracker.guessed-info.possible-cards' | fsTranslate"
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
export class OpponentCardInfoIdComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	cardId: string;
	cardUrl: string;
	createdBy: boolean;
	drawnBy: boolean;
	forged: boolean;
	hasBuffs: boolean;
	guessedInfo: GuessedInfo;
	possibleCards: readonly string[] | null;
	_card: DeckCard;

	@Input() displayGuess: boolean;
	@Input() displayBuff: boolean;

	@Input() set context(value: { deck: DeckState; metadata: Metadata }) {
		this.context$$.next(value);
	}
	@Input() set card(value: DeckCard) {
		this.card$$.next(value);
	}

	private context$$ = new BehaviorSubject<{ deck: DeckState; metadata: Metadata } | null>(null);
	private card$$ = new BehaviorSubject<DeckCard | null>(null);

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly allCards: CardsFacadeService,
	) {
		super(cdr);
	}

	ngAfterContentInit() {
		combineLatest([this.context$$, this.card$$])
			.pipe(
				filter(([context, card]) => !!context?.deck && !!context?.metadata && !!card),
				this.mapData(([context, card]) => this.buildInfo(context!.deck, context!.metadata, card)),
			)
			.subscribe();
	}

	handleMissingImage(event: Event) {
		console.warn('missing image', this.cardId, this.cardUrl, this.createdBy, this.drawnBy);
	}

	private buildInfo(context: DeckState, metadata: Metadata, card: DeckCard): void {
		// Keep the || to handle empty card id
		const realCardId = this.normalizeEnchantment(card.cardId, card.lastAffectedByCardId || card.creatorCardId);
		this.createdBy = !card.cardId && !!card.creatorCardId;
		this.drawnBy =
			!card.cardId &&
			!!card.lastAffectedByCardId &&
			// Issue: if a card is "created by" something in deck, then drawn by a tutor, it won't show any information,
			// which will in itself give a hint
			// !value.creatorCardId &&
			// This might reduce the risk of this issue appearing
			!this.createdBy &&
			publicCardCreators.includes(card.lastAffectedByCardId as CardIds);
		this.hasBuffs = card.buffCardIds?.length > 0;
		this.forged = card.forged > 0;

		this.cardId =
			realCardId || (this.createdBy && card.creatorCardId) || (this.drawnBy && card.lastAffectedByCardId);
		this.cardUrl = this.cardId
			? `https://static.zerotoheroes.com/hearthstone/cardart/256x/${this.cardId}.jpg`
			: undefined;
		this._card = card.update({
			cardId: this.cardId,
			// We probably don't need to update the other fields, as they are not displayed
			cardName: this.cardId === card.cardId ? card.cardName : this.i18n.getCardName(this.cardId),
		} as DeckCard);
		this.guessedInfo = card.guessedInfo;
		if (this.guessedInfo?.possibleCards) {
			this.possibleCards = this.guessedInfo.possibleCards;
		} else if (this.forged) {
			// Build the list of possible card classes based on the card classes in the deck that were part of the initial deck
			// and the hero classes
			// This is a bit difficult, because we have two scenarios at odd with each other:
			// - We compute the class when the card is created, but we might not know it (because of tourists)
			// - We compute the class afterwards, but the hero might have changed
			// - temp fix: remove the hero classes
			const cardClasses: readonly CardClass[] = context
				.getAllCardsFromStarterDeck()
				.filter((c) => c?.cardId)
				.flatMap((card) => this.allCards.getCard(card.cardId).classes ?? [])
				.filter((value, index, self) => self.indexOf(value) === index)
				.map((cardClass) => CardClass[cardClass]);
			console.debug('[debug] cardClasses', cardClasses);
			const heroClasses: readonly CardClass[] = []; // context.hero?.classes ?? [];
			console.debug('[debug] heroClasses', heroClasses);
			const allClasses: readonly CardClass[] = [...cardClasses, ...heroClasses].filter(
				(value, index, self) => self.indexOf(value) === index,
			);
			const possibleForgedCards = getPossibleForgedCards(metadata.formatType, allClasses, this.allCards);
			this.possibleCards = possibleForgedCards;
			console.debug('[debug] possibleForgedCards', possibleForgedCards);
		}
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
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
