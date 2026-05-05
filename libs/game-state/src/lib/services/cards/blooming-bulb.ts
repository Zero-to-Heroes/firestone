/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, GameTag, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const BloomingBulb: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.CultivatingSprite_BloomingBulbToken_MEND_100t],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const deckCard = input.inputOptions.deckState.findCard(input.entityId)?.card;
		const v = deckCard?.tags?.[GameTag.TAG_SCRIPT_DATA_NUM_1];
		const cost = v != null && v >= 0 ? v : 1;
		return filterCards(
			CardIds.CultivatingSprite_BloomingBulbToken_MEND_100t,
			input.allCards,
			(c: ReferenceCard) => hasCorrectType(c, CardType.SPELL) && (c.cost ?? 0) === cost,
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const v = input.card.tags?.[GameTag.TAG_SCRIPT_DATA_NUM_1];
		const cost = v != null && v >= 0 ? v : 1;
		const possibleCards = filterCards(
			CardIds.CultivatingSprite_BloomingBulbToken_MEND_100t,
			input.allCards,
			(c: ReferenceCard) => hasCorrectType(c, CardType.SPELL) && (c.cost ?? 0) === cost,
			input.options,
		);
		return { cardType: CardType.SPELL, possibleCards };
	},
};
