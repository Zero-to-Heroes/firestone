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
		return filterCards(
			AlakirLordOfStorms.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', attack),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const atkTag = input.options?.creatorTags?.find((t) => t.Name === GameTag.ATK);
		const attack = atkTag?.Value ?? 2;
		const possibleCards = filterCards(
			AlakirLordOfStorms.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', attack),
			input.options,
		);
		return {
			cardType: CardType.MINION,
			cost: { cost: attack, comparison: '==' },
			possibleCards: possibleCards,
		};
	},
};
