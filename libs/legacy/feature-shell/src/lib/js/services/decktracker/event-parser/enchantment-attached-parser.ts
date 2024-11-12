import { CardIds } from '@firestone-hs/reference-data';
import { DeckCard, GameState } from '@firestone/game-state';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../models/game-event';
import { getCardForGlobalEffect, globalEffectCards } from '../../hs-utils';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

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
				entityId: null,
				cardId: globalEffectCardId,
				cardName: this.i18n.getCardName(globalEffectCardId, refCard.name),
				manaCost: refCard?.cost,
				rarity: refCard?.rarity?.toLowerCase(),
				zone: null,
			} as DeckCard);
			newGlobalEffects = this.helper.addSingleCardToZone(deck.globalEffects, card);
		}

		const newPlayerDeck = deck.update({
			enchantments: [...deck.enchantments, { cardId, entityId }],
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
