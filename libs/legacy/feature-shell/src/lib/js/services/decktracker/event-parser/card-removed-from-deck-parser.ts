import { CardIds } from '@firestone-hs/reference-data';
import { DeckCard, DeckState, GameState, getProcessedCard } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../models/game-event';
import { FAKE_JOUST_CARDS } from '../../hs-utils';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class CardRemovedFromDeckParser implements EventParser {
	constructor(private readonly helper: DeckManipulationHelper, private readonly allCards: CardsFacadeService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		const card = this.helper.findCardInZone(deck.deck, cardId, entityId, true);
		console.debug('[card-removed] found card', card, cardId, entityId, deck.deck);
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
		const refCard = getProcessedCard(card?.cardId, deck, this.allCards);
		const cardWithZone = card.update({
			zone: 'SETASIDE',
			manaCost: card.manaCost ?? refCard?.cost,
			// FIXME: this is not always true, e.g. when Zilliax is shuffled in the deck some weird stuff happens
			milled:
				card.createdByJoust || gameEvent.additionalData.removedByCardId === CardIds.Overplanner_VAC_444
					? false
					: true,
		} as DeckCard);
		console.debug('[card-removed]', 'cardWithZone', card?.cardId, cardWithZone, refCard);

		// If the JOUST card isn't present in the deck yet, add it to the known cards
		if (card.createdByJoust && !FAKE_JOUST_CARDS.includes(card.creatorCardId as CardIds)) {
			console.debug('[card-removed] handling removal of JOUST card', card);
			const isCardKnownInDeckYet =
				!!card.cardId &&
				newDeck.filter((c) => !c.temporaryCard && !c.createdByJoust).some((c) => c.cardId === card.cardId);
			console.debug(
				'[card-removed] is card known in deck yet?',
				isCardKnownInDeckYet,
				newDeck.filter((c) => !c.temporaryCard && !c.createdByJoust).filter((c) => c.cardId === card.cardId),
			);
			if (!isCardKnownInDeckYet) {
				const newCard = DeckCard.create({
					cardId: cardId,
					cardName: refCard.name,
					manaCost: refCard.cost,
					rarity: refCard.rarity ? refCard.rarity.toLowerCase() : undefined,
				} as DeckCard);
				console.debug('[card-removed] adding JOUST card to known cards', newCard);
				newDeck = this.helper.addSingleCardToZone(newDeck, newCard);
				console.debug('[card-removed] new deck', newDeck);
			}
		}
		console.debug('[card-removed]', 'update card', card, cardWithZone);
		const previousOtherZone = deck.otherZone;
		const newOtherZone: readonly DeckCard[] = this.helper.addSingleCardToZone(previousOtherZone, cardWithZone);
		const newPlayerDeck = Object.assign(new DeckState(), deck, {
			deck: newDeck,
			otherZone: newOtherZone,
		} as DeckState);
		console.debug('[card-removed]', 'newPlayerDeck', newPlayerDeck);
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.CARD_REMOVED_FROM_DECK;
	}
}
