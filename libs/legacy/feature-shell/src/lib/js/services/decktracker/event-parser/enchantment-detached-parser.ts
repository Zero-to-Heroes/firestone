import { CardIds } from '@firestone-hs/reference-data';
import { GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../models/game-event';
import { getCardForGlobalEffect, globalEffectCards } from '../../hs-utils';
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

		let newGlobalEffects = deck.globalEffects;
		if (globalEffectCards.includes(cardId as CardIds)) {
			const globalEffectCardId = getCardForGlobalEffect(cardId as CardIds);
			newGlobalEffects = deck.globalEffects.filter((effect) => effect.cardId !== globalEffectCardId);
		}

		const newPlayerDeck = deck.update({
			enchantments: deck.enchantments.filter((enchantment) => enchantment.entityId !== entityId),
			globalEffects: newGlobalEffects,
		});

		return currentState.update({
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.ENCHANTMENT_DETACHED;
	}
}
