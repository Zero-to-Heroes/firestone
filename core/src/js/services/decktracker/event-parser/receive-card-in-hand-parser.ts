import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@services/cards-facade.service';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { cardsRevealedWhenDrawn, forcedHiddenCardCreators, publicCardCreators } from '../../hs-utils';
import { LocalizationFacadeService } from '../../localization-facade.service';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class ReceiveCardInHandParser implements EventParser {
	constructor(
		private readonly helper: DeckManipulationHelper,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.RECEIVE_CARD_IN_HAND;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		const creatorCardId = gameEvent.additionalData.creatorCardId;
		if (!localPlayer) {
			console.warn('[ReceiveCardInHandParser] missing local player from event', gameEvent);
			return currentState;
		}

		// console.debug('[receive-card-in-hand] handling event', cardId, entityId, gameEvent);
		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		// Some buffs are deduced from the creator card information, instead of being explicitly set
		// by the game
		const lastInfluencedByCardId: CardIds =
			gameEvent.additionalData?.lastInfluencedByCardId ?? gameEvent.additionalData?.creatorCardId;
		const buffingEntityCardId = gameEvent.additionalData.buffingEntityCardId;
		const buffCardId = gameEvent.additionalData.buffCardId;
		const isCardInfoPublic =
			isPlayer ||
			(!forcedHiddenCardCreators.includes(lastInfluencedByCardId as CardIds) &&
				(cardsRevealedWhenDrawn.includes(cardId as CardIds) ||
					publicCardCreators.includes(lastInfluencedByCardId)));
		// console.debug(
		// 	'[receive-card-in-hand] isCardInfoPublic',
		// 	isCardInfoPublic,
		// 	isPlayer,
		// 	cardsRevealedWhenDrawn.includes(cardId as CardIds),
		// 	cardId,
		// 	publicCardCreators.includes(lastInfluencedByCardId),
		// 	lastInfluencedByCardId,
		// );

		// First try and see if this card doesn't come from the board or from the other zone (in case of discovers)
		const boardCard = this.helper.findCardInZone(deck.board, null, entityId);
		const otherCard = this.helper.findCardInZone(deck.otherZone, null, entityId);

		// If a C'Thun piece was set aside, we know its data when getting the card back to hand, so we want to hide it
		const otherCardWithObfuscation =
			isCardInfoPublic || !otherCard
				? otherCard?.update({
						creatorCardId: creatorCardId,
				  })
				: otherCard.update({
						creatorCardId: undefined,
						cardId: undefined,
						cardName: undefined,
						lastAffectedByCardId: undefined,
				  } as DeckCard);

		const newBoard = boardCard
			? this.helper.removeSingleCardFromZone(deck.board, null, entityId, deck.deckList.length === 0)[0]
			: deck.board;
		const newOther = otherCardWithObfuscation
			? this.helper.removeSingleCardFromZone(deck.otherZone, null, entityId)[0]
			: deck.otherZone;
		//console.debug('[receive-card-in-hand] new board', newBoard, newOther);

		const cardData = cardId ? this.allCards.getCard(cardId) : null;
		const cardWithDefault =
			boardCard ||
			otherCardWithObfuscation ||
			DeckCard.create({
				cardId: isCardInfoPublic ? cardId : null,
				entityId: entityId,
				cardName: isCardInfoPublic && cardData ? this.i18n.getCardName(cardId, cardData.name) : null,
				manaCost: isCardInfoPublic && cardData ? cardData.cost : null,
				rarity: isCardInfoPublic && cardData && cardData.rarity ? cardData.rarity.toLowerCase() : null,
				creatorCardId: creatorCardId,
			} as DeckCard);
		// console.debug(
		// 	'[receive-card-in-hand] cardWithDefault',
		// 	cardWithDefault,
		// 	creatorCardId,
		// 	otherCard,
		// 	otherCardWithObfuscation,
		// );

		const otherCardWithBuffs =
			buffingEntityCardId != null || buffCardId != null
				? cardWithDefault.update({
						buffingEntityCardIds: [
							...(cardWithDefault.buffingEntityCardIds || []),
							buffingEntityCardId,
						] as readonly string[],
						buffCardIds: [...(cardWithDefault.buffCardIds || []), buffCardId] as readonly string[],
				  } as DeckCard)
				: cardWithDefault;
		const cardWithAdditionalAttributes = this.addAdditionalAttribues(otherCardWithBuffs, deck);
		const previousHand = deck.hand;
		const newHand: readonly DeckCard[] = this.helper.addSingleCardToZone(
			previousHand,
			cardWithAdditionalAttributes,
			// We keep the buffs for Secret Passage. If this causes an info leak, it should be documented
			// here
			true,
		);
		// console.debug('[receive-card-in-hand] new hand', newHand);

		const newPlayerDeck = Object.assign(new DeckState(), deck, {
			hand: newHand,
			board: newBoard,
			otherZone: newOther,
		} as DeckState);
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	private addAdditionalAttribues(card: DeckCard, deck: DeckState) {
		switch (card?.cardId) {
			case CardIds.SirakessCultist_AbyssalCurseToken:
				const knownCurses = deck
					.getAllCardsInDeck()
					.filter((c) => c.cardId === CardIds.SirakessCultist_AbyssalCurseToken);
				const highestAttribute = !!knownCurses.length
					? Math.max(...knownCurses.map((c) => c.mainAttributeChange ?? 0))
					: -1;
				return card.update({
					mainAttributeChange: highestAttribute + 1,
				});
		}
		return card;
	}

	event(): string {
		return GameEvent.RECEIVE_CARD_IN_HAND;
	}
}
