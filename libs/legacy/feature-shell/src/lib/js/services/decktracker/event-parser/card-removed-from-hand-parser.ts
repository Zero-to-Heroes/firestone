import { DeckCard, GameState, getProcessedCard } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../models/game-event';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class CardRemovedFromHandParser implements EventParser {
	constructor(private readonly helper: DeckManipulationHelper, private readonly allCards: CardsFacadeService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const card = this.helper.findCardInZone(deck.hand, cardId, entityId);

		const previousHand = deck.hand;
		const [newHand, removedCard] = this.helper.removeSingleCardFromZone(previousHand, cardId, entityId);

		// See card-played-from-hand
		const newDeck = deck.deck; // this.helper.updateDeckForAi(gameEvent, currentState, removedCard);

		const refCard = getProcessedCard(card?.cardId, deck, this.allCards);
		const cardWithZone = card.update({
			manaCost: card.manaCost ?? refCard?.cost,
			zone: 'SETASIDE',
		} as DeckCard);

		const previousOtherZone = deck.otherZone;
		const newOtherZone: readonly DeckCard[] = this.helper.addSingleCardToZone(
			previousOtherZone,
			cardWithZone,
			// So that the buffs from Secret Passage are kept. Maybe this will cause other info leaks, but
			// for now let's give it a try and document it when that happens
			true,
		);
		const newPlayerDeck = deck.update({
			hand: newHand,
			otherZone: newOtherZone,
			deck: newDeck,
			destroyedCardsInDeck: [...deck.destroyedCardsInDeck, { cardId, entityId }],
		});
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.CARD_REMOVED_FROM_HAND;
	}
}
