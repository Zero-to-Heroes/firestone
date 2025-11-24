import { CardIds } from '@firestone-hs/reference-data';
import { DeckCard, GameState, getProcessedCard } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../models/game-event';
import { dontActuallyDestroyCardsInDeck, FAKE_JOUST_CARDS } from '../../hs-utils';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

const DONT_REVEAL_REMOVED_CARDS = [CardIds.PirateAdmiralHooktusk_TakeTheirSuppliesToken];
const SILENTLY_REMOVES_FROM_DECK = [CardIds.GaronaHalforcen_KingLlaneToken_TIME_875t];

export class CardRemovedFromDeckParser implements EventParser {
	constructor(
		private readonly helper: DeckManipulationHelper,
		private readonly allCards: CardsFacadeService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		// eslint-disable-next-line prefer-const
		let [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		const removedByCardId = gameEvent.additionalData.removedByCardId;
		const removedByEntityId = gameEvent.additionalData.removedByEntityId;
		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		// When the opponent plays Hooktusk, the logs reveal everything, but not the UI
		// So we override the information here
		// console.debug(
		// 	'[card-removed] card removed',
		// 	isPlayer,
		// 	DONT_REVEAL_REMOVED_CARDS.includes(removedByCardId as CardIds),
		// 	cardId,
		// 	entityId,
		// 	removedByCardId,
		// );
		if (isPlayer && DONT_REVEAL_REMOVED_CARDS.includes(removedByCardId as CardIds)) {
			cardId = null;
			entityId = null;
		}

		const card = this.helper.findCardInZone(deck.deck, cardId, entityId, true);
		// console.debug('[card-removed] found card', card, cardId, entityId, deck.deck);
		const previousDeck = deck.deck;
		let newDeck: readonly DeckCard[] = this.helper.removeSingleCardFromZone(
			previousDeck,
			cardId,
			entityId,
			deck.deckList.length === 0,
			true,
			{
				cost: gameEvent.additionalData.cost,
			},
		)[0];
		if (SILENTLY_REMOVES_FROM_DECK.includes(removedByCardId as CardIds)) {
			return currentState.update({
				[isPlayer ? 'playerDeck' : 'opponentDeck']: deck.update({
					deck: newDeck,
				}),
			});
		}
		const refCard = getProcessedCard(card?.cardId, card?.entityId, deck, this.allCards);
		const cardWithZone = card.update({
			zone: 'SETASIDE',
			refManaCost: card.refManaCost ?? refCard?.cost,
			// FIXME: this is not always true, e.g. when Zilliax is shuffled in the deck some weird stuff happens
			milled: card.createdByJoust || dontActuallyDestroyCardsInDeck.includes(removedByCardId) ? false : true,
			lastAffectedByEntityId: removedByEntityId,
			lastAffectedByCardId: removedByCardId,
		});
		// console.debug('[card-removed]', 'cardWithZone', card?.cardId, cardWithZone, refCard);

		// If the JOUST card isn't present in the deck yet, add it to the known cards
		if (card.createdByJoust && !FAKE_JOUST_CARDS.includes(card.creatorCardId as CardIds)) {
			// console.debug('[card-removed] handling removal of JOUST card', card);
			const isCardKnownInDeckYet =
				!!card.cardId &&
				newDeck.filter((c) => !c.temporaryCard && !c.createdByJoust).some((c) => c.cardId === card.cardId);
			// console.debug(
			// 	'[card-removed] is card known in deck yet?',
			// 	isCardKnownInDeckYet,
			// 	newDeck.filter((c) => !c.temporaryCard && !c.createdByJoust).filter((c) => c.cardId === card.cardId),
			// );
			if (!isCardKnownInDeckYet) {
				const newCard = DeckCard.create({
					cardId: cardId,
					cardName: refCard.name,
					refManaCost: refCard.cost,
					rarity: refCard.rarity ? refCard.rarity.toLowerCase() : undefined,
				} as DeckCard);
				// console.debug('[card-removed] adding JOUST card to known cards', newCard);
				newDeck = this.helper.addSingleCardToZone(newDeck, newCard);
				// console.debug('[card-removed] new deck', newDeck);
			}
		}
		// console.debug('[card-removed]', 'update card', card, cardWithZone);
		const newOtherZone: readonly DeckCard[] = this.helper.addSingleCardToOtherZone(
			deck.otherZone,
			cardWithZone,
			this.allCards,
		);
		const newPlayerDeck = deck.update({
			deck: newDeck,
			otherZone: newOtherZone,
			destroyedCardsInDeck: cardWithZone.milled
				? [...deck.destroyedCardsInDeck, { cardId, entityId }]
				: deck.destroyedCardsInDeck,
		});
		// console.debug('[card-removed]', 'newPlayerDeck', newPlayerDeck);
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.CARD_REMOVED_FROM_DECK;
	}
}
