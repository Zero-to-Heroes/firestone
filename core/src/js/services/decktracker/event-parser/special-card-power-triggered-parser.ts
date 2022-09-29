import { CardIds } from '@firestone-hs/reference-data';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { EventParser } from './event-parser';

const SPECIAL_CARD_POWERS = [CardIds.LorekeeperPolkelt, CardIds.OrderInTheCourt];

export class SpecialCardPowerTriggeredParser implements EventParser {
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.SPECIAL_CARD_POWER_TRIGGERED;
	}

	async parse(
		currentState: GameState,
		gameEvent: GameEvent,
		additionalInfo?: {
			secretWillTrigger?: {
				cardId: string;
				reactingToCardId: string;
				reactingToEntityId: number;
			};
			minionsWillDie?: readonly {
				cardId: string;
				entityId: number;
			}[];
		},
	): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		if (!SPECIAL_CARD_POWERS.includes(cardId as CardIds)) {
			return currentState;
		}

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const newDeck = this.applySpecialCardEffect(deck, cardId);

		return currentState.update({
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newDeck,
		});
	}

	private applySpecialCardEffect(deck: DeckState, cardId: string) {
		switch (cardId) {
			case CardIds.LorekeeperPolkelt:
				return deck.update({
					deck: deck.deck.map((card) =>
						card.update({
							positionFromBottom: undefined,
							positionFromTop: undefined,
							dredged: undefined,
						}),
					),
				});
		}
	}

	event(): string {
		return GameEvent.SPECIAL_CARD_POWER_TRIGGERED;
	}
}
