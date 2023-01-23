import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

const SUPPORTED_EFFECTS = [
	{
		cardId: CardIds.Plaguespreader,
		effect: 'ReuseFX_Shadow_Impact_Transform_CardInHand_Super',
	},
];

export class CustomEffects2Parser implements EventParser {
	constructor(private readonly helper: DeckManipulationHelper, private readonly allCards: CardsFacadeService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return gameEvent.type === GameEvent.SUB_SPELL_END;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [, controllerId, localPlayer] = gameEvent.parse();
		const sourceCardId = gameEvent.additionalData?.sourceCardId;
		const effect = SUPPORTED_EFFECTS.find(
			(e) => e.effect === gameEvent.additionalData?.prefabId && e.cardId === sourceCardId,
		);
		if (!effect) {
			return currentState;
		}

		switch (effect.cardId) {
			case CardIds.Plaguespreader:
				return this.handlePlaguespreader(currentState, gameEvent);
			default:
				return currentState;
		}
	}

	private handlePlaguespreader(currentState: GameState, gameEvent: GameEvent): GameState {
		const [, controllerId, localPlayer] = gameEvent.parse();
		const isPlayer = controllerId === localPlayer.PlayerId;
		const deckToUpdate = !isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		const targetEntityId = gameEvent.additionalData?.targetEntityIds?.length
			? gameEvent.additionalData.targetEntityIds[0]
			: null;
		if (targetEntityId == null) {
			return currentState;
		}

		const cardToUpdate = this.helper.findCardInZone(
			deckToUpdate.hand,
			null,
			gameEvent.additionalData?.targetEntityIds[0],
		);
		if (!cardToUpdate) {
			return currentState;
		}

		const refCard = this.allCards.getCard(CardIds.Plaguespreader);
		const transformedCard = cardToUpdate.update({
			cardId: refCard.id,
			manaCost: refCard.cost,
			cardName: refCard.name,
			actualManaCost: null,
			creatorCardId: CardIds.Plaguespreader,
		});
		const newHand = this.helper.replaceCardInZone(deckToUpdate.hand, transformedCard);
		const newDeck = deckToUpdate.update({
			hand: newHand,
		});
		const newState = currentState.update({
			[!isPlayer ? 'playerDeck' : 'opponentDeck']: newDeck,
		});

		return newState;
	}

	event(): string {
		return 'CustomEffects2Parser';
	}
}
