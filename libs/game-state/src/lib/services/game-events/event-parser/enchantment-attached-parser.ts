import { CardIds } from '@firestone-hs/reference-data';

import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { DeckCard, toTagsObject } from '../../../models/deck-card';
import { GameState } from '../../../models/game-state';
import { getCardForGlobalEffect, globalEffectCards } from '../../hs-utils';
import { GameEvent } from '../game-event';
import { EventParser } from './_event-parser';
import { DeckManipulationHelper } from './deck-manipulation-helper';

export class EnchantmentAttachedParser implements EventParser {
	constructor(
		private readonly helper: DeckManipulationHelper,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: ILocalizationService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		const attachedToEntityId = gameEvent.additionalData.attachedTo;

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const playerEntityId = isPlayer ? localPlayer.Id : gameEvent.opponentPlayer.Id;
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
			const refCard = this.allCards.getCard(globalEffectCardId);
			const card = DeckCard.create({
				entityId: undefined,
				cardId: globalEffectCardId,
				cardName: refCard.name,
				refManaCost: refCard?.cost,
				rarity: refCard?.rarity?.toLowerCase(),
				zone: undefined,
			});
			newGlobalEffects = this.helper.addSingleCardToZone(deck.globalEffects, card);
		}

		const newPlayerDeck = deck.update({
			enchantments: [
				...deck.enchantments.filter((enchantment) => enchantment.entityId !== entityId),
				{
					cardId,
					entityId,
					tags: toTagsObject(gameEvent.additionalData.tags),
					creatorEntityId: gameEvent.additionalData.creatorEntityId,
					creatorCardId: gameEvent.additionalData.creatorCardId,
				},
			],
			globalEffects: newGlobalEffects,
		});

		return currentState.update({
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.ENCHANTMENT_ATTACHED;
	}
}
