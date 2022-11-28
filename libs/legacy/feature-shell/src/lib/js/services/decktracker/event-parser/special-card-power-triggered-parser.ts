import { CardIds } from '@firestone-hs/reference-data';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { CardsFacadeService } from '../../cards-facade.service';
import { globalEffectPowers, globalEffectPowersAlsoOpponent } from '../../hs-utils';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

const SPECIAL_CARD_POWERS = [CardIds.LorekeeperPolkelt, CardIds.OrderInTheCourt, ...globalEffectPowers];

export class SpecialCardPowerTriggeredParser implements EventParser {
	constructor(private readonly allCards: CardsFacadeService, private readonly helper: DeckManipulationHelper) {}

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
		const newState = currentState.update({
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newDeck,
		});
		return this.applyGlobalPowerEffects(newState, isPlayer, cardId);
	}

	private applyGlobalPowerEffects(currentState: GameState, isPlayer: boolean, cardId: string): GameState {
		if (globalEffectPowers.includes(cardId as CardIds)) {
			const cardData = cardId ? this.allCards.getCard(cardId) : null;
			const card = DeckCard.create({
				cardId: cardId,
				entityId: 0,
				cardName: cardData?.name,
				manaCost: cardData?.cost,
				rarity: cardData?.rarity ? cardData.rarity.toLowerCase() : null,
			} as DeckCard);
			const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
			const newPlayerDeck = deck.update({
				globalEffects: [...deck.globalEffects, card],
			});
			const opponentDeck = !isPlayer ? currentState.playerDeck : currentState.opponentDeck;
			let newOpponentDeck = opponentDeck;

			if (globalEffectPowersAlsoOpponent.includes(cardId as CardIds)) {
				newOpponentDeck = opponentDeck.update({
					globalEffects: [...opponentDeck.globalEffects, card],
				});
			}
			return currentState.update({
				[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
				[!isPlayer ? 'playerDeck' : 'opponentDeck']: newOpponentDeck,
			});
		}
		return currentState;
	}

	private applySpecialCardEffect(deck: DeckState, cardId: string) {
		switch (cardId) {
			case CardIds.LorekeeperPolkelt:
			case CardIds.OrderInTheCourt:
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
		return deck;
	}

	event(): string {
		return GameEvent.SPECIAL_CARD_POWER_TRIGGERED;
	}
}
