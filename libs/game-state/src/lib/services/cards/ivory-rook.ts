// Ivory Rook (WON_116)
// 4-Cost 4/4 Warrior Minion
// Taunt. Battlecry: Discover a Taunt minion. Gain Armor equal to its Cost.

import { AllCardsService, CardIds, CardType, GameTag, hasMechanic } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GameState } from '../../models/game-state';
import { canBeDiscoveredByClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GameEvent } from '../game-events/game-event';
import {
	ActionChainParser,
	ChainParsingCard,
	GeneratingCard,
	GuessInfoInput,
	StaticGeneratingCard,
	StaticGeneratingCardInput,
} from './_card.type';
import { filterCards } from './utils';

const tauntMinionFilter = (c: any, currentClass: string | undefined) =>
	hasCorrectType(c, CardType.MINION) && hasMechanic(c, GameTag.TAUNT) && canBeDiscoveredByClass(c, currentClass);

export const IvoryRook: GeneratingCard & StaticGeneratingCard & ChainParsingCard = {
	cardIds: [CardIds.IvoryRook_WON_116],
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const currentClass = input.deckState.getCurrentClass();
		const possibleCards = filterCards(
			IvoryRook.cardIds[0],
			input.allCards,
			(c) => tauntMinionFilter(c, currentClass),
			input.options,
		);
		return {
			cardType: CardType.MINION,
			mechanics: [GameTag.TAUNT],
			possibleCards: possibleCards,
		};
	},
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const currentClass = input.inputOptions.deckState.getCurrentClass();
		return filterCards(
			IvoryRook.cardIds[0],
			input.allCards,
			(c) => tauntMinionFilter(c, currentClass),
			input.inputOptions,
		);
	},
	chainParser: (allCards: AllCardsService) => new IvoryRookParser(allCards),
};

export class IvoryRookParser implements ActionChainParser {
	constructor(private readonly allCards: AllCardsService) {}

	public appliesOnEvent(): GameEvent['type'] {
		return GameEvent.ARMOR_CHANGED;
	}

	public async parse(currentState: GameState, events: readonly GameEvent[]): Promise<GameState> {
		const lastEvent = events[events.length - 1];
		if (lastEvent.additionalData?.armorChange <= 0) {
			return currentState;
		}

		// Walk backward to find the most recent SUB_SPELL_START before this ARMOR_CHANGED.
		// If we hit a SUB_SPELL_END first, the armor change is not inside an Ivory Rook sub spell.
		let ivoryRookEntityId: number | null = null;
		for (let i = events.length - 2; i >= 0; i--) {
			const event = events[i];
			if (event.type === GameEvent.SUB_SPELL_END) {
				break;
			}
			if (event.type === GameEvent.SUB_SPELL_START && event.cardId === CardIds.IvoryRook_WON_116) {
				ivoryRookEntityId = event.entityId;
				break;
			}
		}

		if (ivoryRookEntityId == null) {
			return currentState;
		}

		const receivedCardEvent = [...events].reverse().find((e) => e.type === GameEvent.RECEIVE_CARD_IN_HAND);
		if (receivedCardEvent == null) {
			return currentState;
		}
		if (receivedCardEvent.additionalData?.creatorEntityId !== ivoryRookEntityId) {
			return currentState;
		}

		const armorGained = lastEvent.additionalData.armorChange;
		const isPlayer = lastEvent.controllerId === lastEvent.localPlayer?.PlayerId;
		let deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const receivedCard = deck.findCard(receivedCardEvent.entityId);
		if (!receivedCard) {
			return currentState;
		}

		const narrowedCards = receivedCard.card.guessedInfo.possibleCards?.filter((cardId) => {
			const refCard = this.allCards.getCard(cardId);
			return refCard && (refCard.cost ?? 0) === armorGained;
		});
		const updatedIvoryRook = receivedCard.card.update({
			storedInformation: {
				...receivedCard.card.storedInformation,
				armorGained: armorGained,
			},
			guessedInfo: {
				...receivedCard.card.guessedInfo,
				cost: armorGained,
				possibleCards: narrowedCards,
			},
		});
		const updatedZone = deck[receivedCard.zone].map((c) =>
			c.entityId === updatedIvoryRook.entityId ? updatedIvoryRook : c,
		);
		deck = deck.update({ [receivedCard.zone]: updatedZone });

		return currentState.update(isPlayer ? { playerDeck: deck } : { opponentDeck: deck });
	}
}
