import { CardIds } from '@firestone-hs/reference-data';
import { DeckCard, DeckState, GameState, getProcessedCard, toTagsObject } from '@firestone/game-state';
import { Mutable } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../models/game-event';
import { LocalizationFacadeService } from '../../localization-facade.service';
import { reverseIfNeeded } from './card-dredged-parser';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export const WHIZBANG_DECK_CARD_IDS = [
	CardIds.SplendiferousWhizbang_SeptupletDeckToken_TOY_700t1,
	CardIds.SplendiferousWhizbang_RainbowDeckToken_TOY_700t2,
	CardIds.SplendiferousWhizbang_DeckOfTreasuresToken_TOY_700t3,
	CardIds.SplendiferousWhizbang_ShrunkenDeckToken_TOY_700t4,
	CardIds.SplendiferousWhizbang_WonderfulDeckToken_TOY_700t6,
	CardIds.SplendiferousWhizbang_DeckOfDiscoveryToken_TOY_700t7,
	CardIds.SplendiferousWhizbang_QuestingDeckToken_TOY_700t8,
	CardIds.SplendiferousWhizbang_DeckOfWishesToken_TOY_700t9,
	CardIds.SplendiferousWhizbang_DeckOfHeroesToken_TOY_700t10,
	CardIds.SplendiferousWhizbang_DeckOfLegendsToken_TOY_700t11,
	CardIds.SplendiferousWhizbang_DeckOfVillainsToken_TOY_700t12,
];

export class CardRevealedParser implements EventParser {
	constructor(
		private readonly helper: DeckManipulationHelper,
		private readonly cards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		// const creatorCardId = gameEvent.additionalData.creatorCardId;
		// For some reason, during a reconnect, the logs contain the full list of all cards
		// in our deck and puts them in the SETASIDE zone.
		if (currentState.reconnectOngoing) {
			return currentState;
		}

		const isPlayer = reverseIfNeeded(controllerId === localPlayer.PlayerId, gameEvent.additionalData.creatorCardId);
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const dbCard = getProcessedCard(cardId, entityId, deck, this.cards);
		let positionFromBottom = undefined;
		if (gameEvent.additionalData.revealedFromBlock === 'DREDGE') {
			// Make sure there is no overlap with existing cards
			// When we dredge we are at the very bottom, so we can increase the current index by any big number
			// Only increase it at the first time of the dredge block
			if (gameEvent.additionalData.indexInBlock === 0) {
				DeckCard.deckIndexFromBottom += 4;
			}
			positionFromBottom = DeckCard.deckIndexFromBottom + 3 - gameEvent.additionalData.indexInBlock;
			console.debug(
				'[card-revealed] dredge',
				positionFromBottom,
				DeckCard.deckIndexFromBottom,
				gameEvent.additionalData.indexInBlock,
			);
		}

		const card = DeckCard.create({
			cardId: cardId,
			entityId: entityId,
			cardName: dbCard.name,
			refManaCost: dbCard.cost,
			actualManaCost: gameEvent.additionalData.cost ?? dbCard.cost,
			rarity: dbCard.rarity,
			zone: 'SETASIDE',
			temporaryCard: true,
			lastAffectedByCardId: gameEvent.additionalData.creatorCardId || gameEvent.additionalData.originEntityCardId,
			positionFromBottom: positionFromBottom,
			tags: gameEvent.additionalData.tags ? toTagsObject(gameEvent.additionalData.tags) : {},
		} as DeckCard);
		console.debug('[card-revealed] card', card.cardId, card, gameEvent);

		// Simply adding the card to the zone doesn't work if the card already exist (eg we have put a card at the
		// bottom of the deck with another card previously)
		// The issue here is that we used "REVEALED" for both when a new card arrives, and when we show an existing card
		// If the entityId already exists, we remove then add back. Otherwise, we just add
		const newOther: readonly DeckCard[] =
			// Replacing doesn't work when we resurrect a minion: if we replace, we will find a card ith the same cardId
			// and dfifferent entityId, and will remove the previous one.
			// However, that's exactly the behavior we want to have for dredge.
			// So for now, let's keep this hack and only replace in case of Dredge
			gameEvent.additionalData.revealedFromBlock === 'DREDGE'
				? this.helper.empiricReplaceCardInOtherZone(deck.otherZone, card, false, this.cards)
				: this.helper.addSingleCardToOtherZone(deck.otherZone, card, this.cards);
		(card as Mutable<DeckCard>).positionFromBottom = positionFromBottom;
		console.debug(
			'[card-revealed] newOther',
			card.cardId,
			gameEvent.additionalData.revealedFromBlock,
			newOther,
			deck.otherZone,
			card,
			gameEvent,
		);
		let globalEffects = deck.globalEffects;
		if (
			WHIZBANG_DECK_CARD_IDS.includes(card.cardId as CardIds) &&
			!globalEffects?.some((c) => c.cardId === card.cardId)
		) {
			const globalEffectCard = DeckCard.create({
				entityId: null,
				cardId: card.cardId,
				cardName: dbCard.name,
				refManaCost: dbCard?.cost,
				rarity: dbCard?.rarity?.toLowerCase(),
				zone: null,
			} as DeckCard);
			globalEffects = this.helper.addSingleCardToZone(globalEffects, globalEffectCard);
		}
		const newPlayerDeck = Object.assign(new DeckState(), deck, {
			otherZone: newOther,
			globalEffects: globalEffects,
		} as DeckState);
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.CARD_REVEALED;
	}
}
