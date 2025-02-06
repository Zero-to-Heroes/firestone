import { GameTag } from '@firestone-hs/reference-data';
import { DeckCard, DeckState, GameState, getProcessedCard } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../models/game-event';
import { LocalizationFacadeService } from '../../localization-facade.service';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class MinionSummonedParser implements EventParser {
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
		const creatorCardId = gameEvent.additionalData ? gameEvent.additionalData.creatorCardId : null;

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const dbCard = getProcessedCard(cardId, entityId, deck, this.cards);
		const costFromTags = gameEvent.additionalData.tags?.find((t) => t.Name === GameTag.COST)?.Value;
		const card = DeckCard.create({
			cardId: cardId,
			entityId: entityId,
			cardName: dbCard.name,
			refManaCost: dbCard.cost,
			actualManaCost: costFromTags ?? dbCard.cost,
			rarity: dbCard.rarity?.toLowerCase(),
			creatorCardId: creatorCardId,
			zone: 'PLAY',
			temporaryCard: false,
			playTiming: GameState.playTiming++,
			putIntoPlay: true,
			tags: gameEvent.additionalData.tags,
		} as DeckCard);

		const newBoard: readonly DeckCard[] = this.helper.addSingleCardToZone(deck.board, card);

		const newPlayerDeck = Object.assign(new DeckState(), deck, {
			board: newBoard,
		} as DeckState);
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.MINION_SUMMONED;
	}
}
