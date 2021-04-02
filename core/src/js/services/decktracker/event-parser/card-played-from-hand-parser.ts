import { CardIds, Race } from '@firestone-hs/reference-data';
import { ReferenceCard } from '@firestone-hs/reference-data/lib/models/reference-cards/reference-card';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { globalEffectCards } from '../../hs-utils';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class CardPlayedFromHandParser implements EventParser {
	constructor(private readonly helper: DeckManipulationHelper, private readonly allCards: AllCardsService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.CARD_PLAYED;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const card = this.helper.findCardInZone(deck.hand, cardId, entityId);
		// console.log('[card-played-from-hand] card in zone', card, deck.hand, cardId, entityId);

		const [newHand, removedCard] = this.helper.removeSingleCardFromZone(
			deck.hand,
			cardId,
			entityId,
			deck.deckList.length === 0,
		);
		// console.log('removed card from hand', removedCard, currentState, gameEvent);
		let newDeck =
			removedCard != null ? this.helper.updateDeckForAi(gameEvent, currentState, removedCard) : deck.deck;
		// console.log('removed card from hand', removedCard, deck.deck, newDeck);
		// This happens when we create a card in the deck, then leave it there when the opponent draws it
		// (to avoid info leaks). When they play it we won't find it in the "hand" zone, so we try
		// and see if it is somewhere in the deck
		if (removedCard == null && cardId) {
			const [newDeckAfterReveal, removedCardFromDeck] = this.helper.removeSingleCardFromZone(
				newDeck,
				cardId,
				entityId,
				deck.deckList.length === 0,
			);
			// console.log('after removing from deck', newDeckAfterReveal, removedCardFromDeck, newDeck);
			if (removedCardFromDeck) {
				newDeck = newDeckAfterReveal;
			}
		}

		// Only minions end up on the board
		const refCard = this.allCards.getCard(cardId);
		const isOnBoard = refCard && refCard.type === 'Minion';
		const cardWithZone =
			card?.update({
				zone: isOnBoard ? 'PLAY' : null,
			} as DeckCard) ||
			DeckCard.create({
				entityId: entityId,
				cardId: cardId,
				cardName: refCard?.name,
				manaCost: refCard?.cost,
				rarity: refCard?.rarity?.toLowerCase(),
				zone: isOnBoard ? 'PLAY' : null,
			} as DeckCard);
		const newBoard: readonly DeckCard[] = isOnBoard
			? this.helper.addSingleCardToZone(deck.board, cardWithZone)
			: deck.board;
		const newOtherZone: readonly DeckCard[] = isOnBoard
			? deck.otherZone
			: this.helper.addSingleCardToZone(deck.otherZone, cardWithZone);

		let newGlobalEffects: readonly DeckCard[] = deck.globalEffects;
		if (globalEffectCards.includes(card?.cardId)) {
			newGlobalEffects = this.helper.addSingleCardToZone(deck.globalEffects, cardWithZone);
		}

		const isElemental =
			refCard?.type === 'Minion' && refCard?.race?.toLowerCase() === Race[Race.ELEMENTAL].toLowerCase();

		const newPlayerDeck = Object.assign(new DeckState(), deck, {
			hand: newHand,
			board: newBoard,
			deck: newDeck,
			otherZone: newOtherZone,
			cardsPlayedThisTurn: [...deck.cardsPlayedThisTurn, cardWithZone] as readonly DeckCard[],
			globalEffects: newGlobalEffects,
			spellsPlayedThisMatch: deck.spellsPlayedThisMatch + (refCard?.type === 'Spell' ? 1 : 0),
			elementalsPlayedThisTurn: deck.elementalsPlayedThisTurn + (isElemental ? 1 : 0),
		} as DeckState);

		const deckAfterSpecialCaseUpdate: DeckState = this.handleSpecialCases(cardId, newPlayerDeck);
		// console.log('[secret-turn-end] updated deck', newPlayerDeck);
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: deckAfterSpecialCaseUpdate,
		});
	}

	private handleSpecialCases(cardId: string, deckState: DeckState): DeckState {
		switch (cardId) {
			case CardIds.Collectible.Mage.IncantersFlow:
				return this.handleIncantersFlow(deckState);
			case CardIds.Collectible.Mage.DeckOfLunacy:
				return this.handleDeckOfLunacy(deckState);
			default:
				return deckState;
		}
	}

	private handleIncantersFlow(deckState: DeckState): DeckState {
		const currentDeck = deckState.deck;
		const newDeck: readonly DeckCard[] = currentDeck.map(card => {
			const refCard = card.cardId ? this.allCards.getCard(card.cardId) : null;
			if (refCard?.type !== 'Spell' && card.cardType != 'Spell') {
				return card;
			}

			//console.debug('updating mana cost for', card.cardName, card.getEffectiveManaCost(), card);
			const result = card.update({
				actualManaCost: Math.max(0, card.getEffectiveManaCost() - 1),
			} as DeckCard);
			//console.debug('updated mana cost for', result.cardName, result.getEffectiveManaCost(), result);
			return result;
		});
		return deckState.update({
			deck: newDeck,
		} as DeckState);
	}

	private handleDeckOfLunacy(deckState: DeckState): DeckState {
		const currentDeck = deckState.deck;
		const newDeck: readonly DeckCard[] = currentDeck.map(card => {
			const refCard = card.cardId ? this.allCards.getCard(card.cardId) : null;
			if (refCard?.type !== 'Spell' && card.cardType != 'Spell') {
				return card;
			}

			//console.debug('updating deck of lunacy for', card.cardName, card.getEffectiveManaCost(), card);
			const result = card.update({
				cardId: undefined,
				cardName: `Unknown ${card.getEffectiveManaCost() + 3} mana spell`,
				creatorCardId: CardIds.Collectible.Mage.DeckOfLunacy,
				rarity: 'unknown',
				cardType: 'Spell',
				cardMatchCondition: (other: ReferenceCard) => other.cost === card.getEffectiveManaCost() + 3,
			} as DeckCard);
			//console.debug('updated deck of lunacy for', result.cardName, result.getEffectiveManaCost(), result);
			return result;
		});
		return deckState.update({
			deck: newDeck,
		} as DeckState);
	}

	event(): string {
		return GameEvent.CARD_PLAYED;
	}
}
