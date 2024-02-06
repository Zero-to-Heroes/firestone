import { CardIds, CardType, GameTag } from '@firestone-hs/reference-data';
import { DeckCard, GameState, ShortCard } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../models/game-event';
import { MinionsDiedEvent } from '../../../models/mainwindow/game-events/minions-died-event';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class MinionDiedParser implements EventParser {
	constructor(private readonly helper: DeckManipulationHelper, private readonly allCards: CardsFacadeService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: MinionsDiedEvent): Promise<GameState> {
		const [, , localPlayer] = gameEvent.parse();

		const deadMinions = gameEvent.additionalData.deadMinions;
		let result = currentState;
		for (const deadMinion of deadMinions) {
			const cardId = deadMinion.CardId;
			const entityId = deadMinion.EntityId;
			const isPlayer = deadMinion.ControllerId === localPlayer?.PlayerId;
			const deck = isPlayer ? result.playerDeck : result.opponentDeck;
			const card = this.helper.findCardInZone(deck.board, cardId, entityId);
			const refCard = this.allCards.getCard(cardId);
			const cardWithZone = card.update({
				zone: refCard.type?.toUpperCase() === CardType[CardType.MINION] ? 'GRAVEYARD' : 'SETASIDE',
				// If we keep the same entityId, our safeguards prevent us from adding it twice to the other zone
				// Why do we want to add it twice to the other zone again?
				entityId: -card.entityId,
			} as DeckCard);

			const newBoard: readonly DeckCard[] = this.helper.removeSingleCardFromZone(deck.board, cardId, entityId)[0];
			const newOther: readonly DeckCard[] = this.helper.addSingleCardToZone(deck.otherZone, cardWithZone);
			const newPlayerDeck = deck.update({
				board: newBoard,
				otherZone: newOther,
				elwynnBoarsDeadThisMatch: deck.elwynnBoarsDeadThisMatch + (cardId === CardIds.ElwynnBoar ? 1 : 0),
				volatileSkeletonsDeadThisMatch:
					deck.volatileSkeletonsDeadThisMatch + (cardId === CardIds.VolatileSkeleton ? 1 : 0),
				minionsDeadSinceLastTurn: [
					...deck.minionsDeadSinceLastTurn,
					{ cardId: cardId, entityId: entityId },
				] as readonly ShortCard[],
				minionsDeadThisTurn: [
					...deck.minionsDeadThisTurn,
					{ cardId: cardId, entityId: entityId },
				] as readonly ShortCard[],
				minionsDeadThisMatch: [...deck.minionsDeadThisMatch, { cardId: cardId, entityId: entityId }],
				lastDeathrattleMinionDead: refCard.mechanics?.includes(GameTag[GameTag.DEATHRATTLE])
					? { cardId, entityId }
					: deck.lastDeathrattleMinionDead,
			});
			result = Object.assign(new GameState(), result, {
				[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
			});
		}
		return result;
	}

	event(): string {
		return GameEvent.MINIONS_DIED;
	}
}
