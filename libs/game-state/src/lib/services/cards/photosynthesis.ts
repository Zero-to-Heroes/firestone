/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Photosynthesis
 * EDR_848
 * 3 Mana Druid Spell (Nature)
 * Restore #6 Health. Get 3 random Druid spells.
 */
import { CardClass, CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const Photosynthesis: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Photosynthesis_EDR_848],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			Photosynthesis.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.SPELL) && hasCorrectClass(c, CardClass.DRUID),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.SPELL,
			cardClasses: [CardClass.DRUID],
			possibleCards: filterCards(
				Photosynthesis.cardIds[0],
				input.allCards,
				(c) => hasCorrectType(c, CardType.SPELL) && hasCorrectClass(c, CardClass.DRUID),
				input.options,
			),
		};
	},
};
