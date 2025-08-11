import { ReferenceCard } from '@firestone-hs/reference-data';

import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard } from '../../../models/deck-card';
import { DeckState } from '../../../models/deck-state';
import { GameState } from '../../../models/game-state';
import { getProcessedCard } from '../../card-utils';
import { GameEvent } from '../game-event';
import { EventParser } from './_event-parser';
import { DeckManipulationHelper } from './deck-manipulation-helper';

export class CardChangedOnBoardParser implements EventParser {
	constructor(
		private readonly helper: DeckManipulationHelper,
		private readonly allCards: CardsFacadeService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		const creatorCardId = gameEvent.additionalData ? gameEvent.additionalData.creatorCardId : null;

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		// We don't pass the cardId because we know it has changed
		const card = this.helper.findCardInZone(deck.board, null, entityId);
		if (!card) {
			// console.warn('[card-changed-on-board] could not find card change on board', entityId, deck.board);
			return currentState;
		}
		const boardWithRemovedCard: readonly DeckCard[] = this.helper.removeSingleCardFromZone(
			deck.board,
			null,
			entityId,
		)[0];

		// The CARD_CHANGED* events keep the same entityId, but change the cardId, and thus the card name
		const dbCard = getProcessedCard(cardId, entityId, deck, this.allCards) || ({} as ReferenceCard);
		// So that we can keep track of transformed cards
		const oldCard = card.update({
			zone: 'TRANSFORMED_INTO_OTHER',
			transformedInto: cardId,
		} as DeckCard);
		const updatedCard = card.update({
			cardId: cardId,
			cardName: dbCard.name,
			refManaCost: dbCard.cost,
			actualManaCost: undefined,
			rarity: dbCard.rarity?.toLowerCase(),
			creatorCardId: creatorCardId,
			creatorEntityId: gameEvent.additionalData.creatorEntityId,
		});
		const newBoard: readonly DeckCard[] = this.helper.addSingleCardToZone(boardWithRemovedCard, updatedCard);
		const newOther: readonly DeckCard[] = this.helper.addSingleCardToOtherZone(
			deck.otherZone,
			oldCard,
			this.allCards,
		);
		const newPlayerDeck = Object.assign(new DeckState(), deck, {
			board: newBoard,
			otherZone: newOther,
		});
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.CARD_CHANGED_ON_BOARD;
	}
}
