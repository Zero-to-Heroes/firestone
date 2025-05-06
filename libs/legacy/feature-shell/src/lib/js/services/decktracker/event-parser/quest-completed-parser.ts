import { DeckState, GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../models/game-event';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class QuestCompletedParser implements EventParser {
	constructor(private readonly helper: DeckManipulationHelper, private readonly allCards: CardsFacadeService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		const existingQuest = this.helper.findCardInZone(deck.otherZone, cardId, entityId);
		if (!existingQuest) {
			console.warn('[quest-completed] missing quest', cardId, entityId);
			return currentState;
		}
		const newQuest = existingQuest.update({
			zone: 'REMOVEDFROMGAME',
		});
		const newOtherZone = this.helper.replaceCardInOtherZone(deck.otherZone, newQuest, this.allCards);

		const newPlayerDeck = deck.update({
			otherZone: newOtherZone,
		} as DeckState);

		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.QUEST_COMPLETED;
	}
}
