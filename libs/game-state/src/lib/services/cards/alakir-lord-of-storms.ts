/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, GameTag } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const AlakirLordOfStorms: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.AlakirLordOfStorms_CATA_153],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const playerState = input.inputOptions.deckState.isOpponent
			? input.inputOptions.gameState.fullGameState?.Opponent
			: input.inputOptions.gameState.fullGameState?.Player;
		const entity = playerState?.AllEntities?.find((e) => e.entityId === input.entityId);
		const baseAttack = input.allCards.getCard(input.cardId)?.attack ?? 2;
		// The appendage (Charged Hand of Al'akir) always buffs Al'akir's attack by +2 (+1 per hand)
		// Herald levels add additional buffs: +1/+2/+4 for levels 1/2/3
		const heraldCount = input.inputOptions.deckState.heraldCountThisGame ?? 0;
		const heraldBuff = heraldCount >= 3 ? 4 : heraldCount >= 2 ? 2 : heraldCount >= 1 ? 1 : 0;
		const appendageBuff = 2;
		const attack = entity?.attack ?? baseAttack + appendageBuff + heraldBuff;
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
