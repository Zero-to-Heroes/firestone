import { DeckCard, GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '@firestone/game-state';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class QuestDestroyedParser implements EventParser {
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

		const existingQuest = this.helper.findCardInZone(deck.otherZone, cardId, entityId);
		if (!existingQuest) {
			console.warn('[quest-destroyed] missing quest', cardId, entityId);
			return currentState;
		}
		const newQuest = existingQuest.update({
			zone: 'REMOVEDFROMGAME',
		});
		const newOtherZone = this.helper.replaceCardInOtherZone(deck.otherZone, newQuest, this.allCards);

		const newGlobalEffects: readonly DeckCard[] = deck.globalEffects.filter((c) => c.entityId !== entityId);

		const newPlayerDeck = deck.update({
			otherZone: newOtherZone,
			globalEffects: newGlobalEffects,
		});

		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
			miscCardsDestroyed: [...(currentState.miscCardsDestroyed || []), cardId],
		});
	}

	event(): string {
		return GameEvent.QUEST_DESTROYED;
	}
}
