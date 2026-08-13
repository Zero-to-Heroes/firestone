/* eslint-disable no-mixed-spaces-and-tabs */
// Ivory Knight (KAR_057, WON_045, CORE_KAR_057)
// 4-Cost Paladin Minion
// Battlecry: Discover a spell. Restore Health to your hero equal to its Cost.

import { AllCardsService, CardIds, CardType, GameTag, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GameState } from '../../models/game-state';
import { canBeDiscoveredByClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GameEvent } from '../game-events/game-event';
import { getEntityTag } from '../parser-entity-utils';
import {
	ActionChainParser,
	ChainParsingCard,
	GeneratingCard,
	GuessInfoInput,
	StaticGeneratingCard,
	StaticGeneratingCardInput,
} from './_card.type';
import { filterCards } from './utils';

const ivoryKnightFilter = (c: ReferenceCard, currentClass: string | undefined) =>
	hasCorrectType(c, CardType.SPELL) && canBeDiscoveredByClass(c, currentClass);

const isIvoryKnightCardId = (cardId: string | null | undefined): boolean =>
	!!cardId && (IvoryKnight.cardIds as readonly string[]).includes(cardId);

export const IvoryKnight: GeneratingCard & StaticGeneratingCard & ChainParsingCard = {
	cardIds: [CardIds.IvoryKnight, CardIds.IvoryKnight_WON_045, CardIds.IvoryKnight_CORE_KAR_057],
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const currentClass = input.deckState.getCurrentClass();
		const possibleCards = filterCards(
			IvoryKnight.cardIds[0],
			input.allCards,
			(c) => ivoryKnightFilter(c, currentClass),
			input.options,
		);
		return {
			cardType: CardType.SPELL,
			possibleCards: possibleCards,
		};
	},
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const currentClass = input.inputOptions.deckState.getCurrentClass();
		return filterCards(
			IvoryKnight.cardIds[0],
			input.allCards,
			(c) => ivoryKnightFilter(c, currentClass),
			input.inputOptions,
		);
	},
	chainParser: (allCards: AllCardsService) => new IvoryKnightParser(allCards),
};

type HealingTarget = {
	Healing?: number;
	TargetEntityId?: number;
};

export class IvoryKnightParser implements ActionChainParser {
	constructor(private readonly allCards: AllCardsService) {}

	public appliesOnEvent(): readonly GameEvent['type'][] {
		// Discover ZONE=HAND and HEALING can arrive in either order in the same POWER block.
		return [GameEvent.HEALING, GameEvent.RECEIVE_CARD_IN_HAND];
	}

	public async parse(currentState: GameState, events: readonly GameEvent[]): Promise<GameState> {
		const healingEvent = [...events]
			.reverse()
			.find((e) => e.type === GameEvent.HEALING && isIvoryKnightCardId(e.additionalData?.sourceCardId));
		if (healingEvent == null) {
			return currentState;
		}

		const ivoryKnightEntityId = healingEvent.additionalData?.sourceEntityId as number | undefined;
		if (ivoryKnightEntityId == null) {
			return currentState;
		}

		const targets = Object.values(healingEvent.additionalData?.targets ?? {}) as HealingTarget[];
		const healAmount = targets.reduce((sum, t) => sum + (t.Healing ?? 0), 0);
		if (healAmount <= 0) {
			return currentState;
		}

		const sourceControllerId = healingEvent.additionalData?.sourceControllerId as number | undefined;
		const isPlayer = sourceControllerId === healingEvent.localPlayer?.PlayerId;
		let deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		const receivedCardEvent = [...events]
			.reverse()
			.find(
				(e) =>
					e.type === GameEvent.RECEIVE_CARD_IN_HAND &&
					(e.additionalData?.creatorEntityId === ivoryKnightEntityId ||
						isIvoryKnightCardId(e.additionalData?.creatorCardId) ||
						isIvoryKnightCardId(e.additionalData?.lastInfluencedByCardId)),
			);

		const receivedCard =
			(receivedCardEvent != null ? deck.findCard(receivedCardEvent.entityId) : undefined) ??
			deck.hand
				.map((c) => ({ card: c, zone: 'hand' as const }))
				.find(
					(entry) =>
						!entry.card.cardId?.length &&
						(entry.card.creatorEntityId === ivoryKnightEntityId ||
							isIvoryKnightCardId(entry.card.creatorCardId)),
				);
		if (!receivedCard) {
			return currentState;
		}

		// Applied heal is capped at missing Health. DAMAGE > 0 after the heal means it was not
		// capped, so cost === heal. DAMAGE === 0 (full health) means cost >= heal.
		const heroEntityId = targets[0]?.TargetEntityId;
		const heroEntity =
			heroEntityId != null ? currentState.parserState?.CurrentEntities?.get(heroEntityId) : undefined;
		const remainingDamage = getEntityTag(heroEntity, GameTag.DAMAGE, 0);
		const exactCost = remainingDamage > 0;
		const comparison: '==' | '>=' = exactCost ? '==' : '>=';

		const narrowedCards = receivedCard.card.guessedInfo.possibleCards?.filter((cardId) => {
			const refCard = this.allCards.getCard(cardId);
			const cost = refCard?.cost ?? 0;
			return exactCost ? cost === healAmount : cost >= healAmount;
		});
		const updatedCard = receivedCard.card.update({
			guessedInfo: {
				...receivedCard.card.guessedInfo,
				cost: { cost: healAmount, comparison },
				possibleCards: narrowedCards,
			},
		});
		const updatedZone = deck[receivedCard.zone].map((c) => (c.entityId === updatedCard.entityId ? updatedCard : c));
		deck = deck.update({ [receivedCard.zone]: updatedZone });

		return currentState.update(isPlayer ? { playerDeck: deck } : { opponentDeck: deck });
	}
}
