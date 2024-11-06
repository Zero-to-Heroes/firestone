import { GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../models/game-event';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class EnchantmentDetachedParser implements EventParser {
	constructor(private readonly helper: DeckManipulationHelper, private readonly allCards: CardsFacadeService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		const attachedToEntityId = gameEvent.additionalData.attachedTo;

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const playerEntityId = isPlayer ? localPlayer.Id : localPlayer.Id;
		const isAttachedToHero =
			attachedToEntityId === playerEntityId ||
			attachedToEntityId === deck.hero?.entityId ||
			attachedToEntityId === deck.heroPower?.entityId;
		if (!isAttachedToHero) {
			return currentState;
		}

		const newPlayerDeck = deck.update({
			enchantments: deck.enchantments.filter((enchantment) => enchantment.entityId !== entityId),
		});

		return currentState.update({
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.ENCHANTMENT_DETACHED;
	}
}
