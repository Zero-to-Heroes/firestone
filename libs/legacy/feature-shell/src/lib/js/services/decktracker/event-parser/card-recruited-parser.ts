import { DeckCard, DeckState, GameState, getProcessedCard } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../models/game-event';
import { LocalizationFacadeService } from '../../localization-facade.service';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class CardRecruitedParser implements EventParser {
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

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const card = this.helper.findCardInZone(deck.deck, cardId, entityId);

		const dbCard = getProcessedCard(cardId, entityId, deck, this.cards);
		const newDeck: readonly DeckCard[] = this.helper.removeSingleCardFromZone(
			deck.deck,
			cardId,
			entityId,
			deck.deckList.length === 0,
		)[0];
		const cardWithZone = card.update({
			cardId: cardId,
			entityId: entityId,
			cardName: this.i18n.getCardName(cardId, dbCard.name),
			refManaCost: card.refManaCost ?? dbCard.cost,
			zone: 'PLAY',
			temporaryCard: false,
			rarity: card.rarity ?? dbCard.rarity?.toLowerCase(),
			playTiming: GameState.playTiming++,
		} as DeckCard);

		const newBoard: readonly DeckCard[] = this.helper.addSingleCardToZone(deck.board, cardWithZone);
		const newPlayerDeck = Object.assign(new DeckState(), deck, {
			deck: newDeck,
			board: newBoard,
		} as DeckState);
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.RECRUIT_CARD;
	}
}
