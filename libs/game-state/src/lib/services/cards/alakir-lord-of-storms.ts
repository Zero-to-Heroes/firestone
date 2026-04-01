/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, GameTag } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { getEntityTag } from '../../services/parser-entity-utils';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const AlakirLordOfStorms: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.AlakirLordOfStorms_CATA_153],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const entity = input.inputOptions.gameState.parserState?.CurrentEntities.get(input.entityId);
		const baseAttack = input.allCards.getCard(input.cardId)?.attack ?? 2;
		const heraldCount = input.inputOptions.deckState.heraldCountThisGame ?? 0;
		const buffPerHand = heraldCount >= 4 ? 4 : heraldCount >= 2 ? 2 : 1;
		const totalAppendageBuff = 2 * buffPerHand;
		const attack = entity ? getEntityTag(entity, GameTag.ATK, baseAttack + totalAppendageBuff) : baseAttack + totalAppendageBuff;
		const allMinions = filterCards(
			AlakirLordOfStorms.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION),
			input.inputOptions,
		);
		const maxCost = allMinions.reduce((max, id) => Math.max(max, input.allCards.getCard(id)?.cost ?? 0), 0);
		const effectiveCost = Math.min(attack, maxCost);
		return allMinions.filter((id) => (input.allCards.getCard(id)?.cost ?? 0) === effectiveCost);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const atkTag = input.options?.creatorTags?.find((t) => t.Name === GameTag.ATK);
		const attack = atkTag?.Value ?? 2;
		const allMinions = filterCards(
			AlakirLordOfStorms.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION),
			input.options,
		);
		const maxCost = allMinions.reduce((max, id) => Math.max(max, input.allCards.getCard(id)?.cost ?? 0), 0);
		const effectiveCost = Math.min(attack, maxCost);
		const possibleCards = allMinions.filter((id) => (input.allCards.getCard(id)?.cost ?? 0) === effectiveCost);
		return {
			cardType: CardType.MINION,
			cost: { cost: effectiveCost, comparison: '==' },
			possibleCards: possibleCards,
		};
	},
};
