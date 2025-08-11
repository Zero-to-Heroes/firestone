import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard } from '../../../models/deck-card';
import { DeckState } from '../../../models/deck-state';
import { GameState } from '../../../models/game-state';
import { hasSpecialCaseParser } from '../../cards/_card.type';
import { cardsInfoCache } from '../../cards/_mapping';
import { globalEffectPowers, globalEffectPowersAlsoOpponent } from '../../hs-utils';
import { GameEvent } from '../game-event';
import { EventParser } from './_event-parser';
import { DeckManipulationHelper } from './deck-manipulation-helper';

const SPECIAL_CARD_POWERS = [
	CardIds.LorekeeperPolkelt,
	CardIds.OrderInTheCourt,
	CardIds.TimelessCausality_TIME_061,
	...globalEffectPowers,
];

export class SpecialCardPowerTriggeredParser implements EventParser {
	constructor(
		private readonly allCards: CardsFacadeService,
		private readonly helper: DeckManipulationHelper,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
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
				refManaCost: cardData?.cost,
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
			default:
				const cardImpl = cardsInfoCache[cardId];
				if (hasSpecialCaseParser(cardImpl)) {
					return cardImpl.specialCaseParser(deck);
				}
		}
		return deck;
	}

	event(): string {
		return GameEvent.SPECIAL_CARD_POWER_TRIGGERED;
	}
}
