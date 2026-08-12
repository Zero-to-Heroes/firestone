import { CardType, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard } from '../../../models/deck-card';
import { DeckState } from '../../../models/deck-state';
import { GameState } from '../../../models/game-state';
import { getProcessedCard } from '../../card-utils';
import { GameEvent } from '../game-event';
import { EventParser } from './_event-parser';
import { DeckManipulationHelper, resolveFallbackCreatorCardIdForDeckRemoval } from './deck-manipulation-helper';

export class CardRecruitedParser implements EventParser {
	constructor(
		private readonly helper: DeckManipulationHelper,
		private readonly cards: CardsFacadeService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const card = this.helper.findCardInZone(deck.deck, cardId, entityId);
		const dbCard = getProcessedCard(cardId, entityId, deck, this.cards);
		if (
			dbCard.type?.toUpperCase() !== CardType[CardType.MINION] &&
			dbCard.type?.toUpperCase() !== CardType[CardType.LOCATION]
		) {
			return currentState;
		}

		const costFromTags = gameEvent.additionalData.tags?.find((t) => t.Name === GameTag.COST)?.Value;
		// RECRUIT_CARD reveals CREATOR on SHOW_ENTITY. Trust that for gift-row removal (do not use
		// trueEntityId — opponent gifts intentionally hide entityId to prevent identity leaks).
		const eventCreatorCardId = gameEvent.additionalData?.creatorCardId;
		const fallbackCreatorCardId =
			eventCreatorCardId ||
			resolveFallbackCreatorCardIdForDeckRemoval({
				gameEventCreatorCardId: eventCreatorCardId,
				handOrRemovedCard: card,
			});
		// When recruiting a created gift, skip cardId/entityId removal so we don't drop an
		// unrelated deckstring copy (or a stamped entityId). Creator fallback prefers a gift
		// whose cardId matches the recruited card, else an anonymous gift row.
		const removeCardId = eventCreatorCardId ? null : cardId;
		const [newDeck, removedCard] = this.helper.removeSingleCardFromZone(
			deck.deck,
			removeCardId,
			eventCreatorCardId ? -1 : entityId,
			deck.deckList.length === 0,
			true,
			null,
			false,
			{ fallbackCreatorCardId, preferredCardId: cardId },
		);
		let additionalKnownCardsInDeck = deck.additionalKnownCardsInDeck;
		if (!removedCard?.cardId) {
			additionalKnownCardsInDeck = additionalKnownCardsInDeck.filter(
				(c, i) => c !== cardId || deck.additionalKnownCardsInDeck.indexOf(c) !== i,
			);
		}
		const baseCard = removedCard ?? card ?? DeckCard.create();
		const cardWithZone = baseCard.update({
			cardId: cardId,
			entityId: entityId,
			cardName: dbCard.name,
			refManaCost: baseCard.refManaCost ?? dbCard.cost,
			actualManaCost: costFromTags ?? dbCard.cost,
			zone: 'PLAY',
			temporaryCard: false,
			rarity: baseCard.rarity ?? dbCard.rarity?.toLowerCase(),
			playTiming: GameState.playTiming++,
			creatorCardId: baseCard.creatorCardId ?? eventCreatorCardId,
			creatorEntityId: baseCard.creatorEntityId ?? gameEvent.additionalData?.creatorEntityId,
		} as DeckCard);

		const newBoard: readonly DeckCard[] = this.helper.addSingleCardToZone(deck.board, cardWithZone);
		const newPlayerDeck = Object.assign(new DeckState(), deck, {
			deck: newDeck,
			board: newBoard,
			additionalKnownCardsInDeck: additionalKnownCardsInDeck,
		} as DeckState);
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.RECRUIT_CARD;
	}
}
