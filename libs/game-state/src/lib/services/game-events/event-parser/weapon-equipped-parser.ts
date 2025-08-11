import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard } from '../../../models/deck-card';
import { DeckState } from '../../../models/deck-state';
import { GameState } from '../../../models/game-state';
import { getProcessedCard } from '../../card-utils';
import { GameEvent } from '../game-event';
import { EventParser } from './_event-parser';
import { DeckManipulationHelper } from './deck-manipulation-helper';

export class WeaponEquippedParser implements EventParser {
	constructor(
		private readonly cards: CardsFacadeService,
		private readonly helper: DeckManipulationHelper,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const dbCard = getProcessedCard(cardId, entityId, deck, this.cards);
		// const creator = gameEvent.additionalData.creatorId;
		const card = DeckCard.create({
			cardId: cardId,
			entityId: entityId,
			cardName: dbCard.name,
			refManaCost: dbCard.cost,
			rarity: dbCard.rarity,
			zone: 'PLAY',
			temporaryCard: false,
			playTiming: GameState.playTiming++,
			creatorCardId: gameEvent.additionalData.creatorCardId,
			creatorEntityId: gameEvent.additionalData.creatorEntityId,
		} as DeckCard);

		const existingCard = deck.findCard(entityId);
		let newDeck = deck.deck;
		// Also need to remove it from the previous zone, if it was equipped directly
		if (existingCard?.zone === 'deck' || !existingCard?.card) {
			newDeck = this.helper.removeSingleCardFromZone(deck.deck, cardId, entityId, true)?.[0] ?? newDeck;
		}
		let additionalKnownCardsInDeck = deck.additionalKnownCardsInDeck;
		if (!existingCard?.card?.cardId) {
			additionalKnownCardsInDeck = additionalKnownCardsInDeck.filter(
				(c, i) => c !== cardId || deck.additionalKnownCardsInDeck.indexOf(c) !== i,
			);
		}

		const newOtherZone: readonly DeckCard[] = this.helper.addSingleCardToOtherZone(
			deck.otherZone,
			card,
			this.cards,
		);
		const newPlayerDeck = deck.update({
			weapon: card,
			deck: newDeck,
			otherZone: newOtherZone,
			additionalKnownCardsInDeck: additionalKnownCardsInDeck,
		} as DeckState);
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.WEAPON_EQUIPPED;
	}
}
