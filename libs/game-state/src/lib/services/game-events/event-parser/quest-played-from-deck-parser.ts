import { CardType, GameTag } from '@firestone-hs/reference-data';

import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard } from '../../../models/deck-card';
import { DeckState } from '../../../models/deck-state';
import { GameState } from '../../../models/game-state';
import { GameEvent } from '../game-event';
import { EventParser } from './_event-parser';
import { DeckManipulationHelper } from './deck-manipulation-helper';

export class QuestPlayedFromDeckParser implements EventParser {
	constructor(
		private readonly helper: DeckManipulationHelper,
		private readonly allCards: CardsFacadeService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		const card = this.helper.findCardInZone(deck.deck, cardId, entityId);
		const previousDeck = deck.deck;
		const [newDeck, removedCard] = this.helper.removeSingleCardFromZone(
			previousDeck,
			cardId,
			entityId,
			deck.deckList.length === 0,
		)[0];
		const cardWithZone = card!.update({
			zone: 'SECRET',
			refManaCost: card!.refManaCost ?? this.allCards.getCard(cardId)?.cost,
			cardName: card!.cardName || this.allCards.getCard(cardId)?.name,
			rarity: card!.rarity ?? this.allCards.getCard(cardId)?.rarity?.toLowerCase(),
			putIntoPlay: true,
			guessedInfo: {
				...card!.guessedInfo,
			},
			tags: {
				...card!.tags,
				[GameTag.QUEST]: 1,
				[GameTag.CARDTYPE]: CardType.SPELL,
			},
		} as DeckCard);
		const newOtherZone: readonly DeckCard[] = this.helper.addSingleCardToOtherZone(
			deck.otherZone,
			cardWithZone,
			this.allCards,
		);
		const newPlayerDeck = Object.assign(new DeckState(), deck, {
			deck: newDeck,
			otherZone: newOtherZone,
		});
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.QUEST_PLAYED_FROM_DECK;
	}
}
