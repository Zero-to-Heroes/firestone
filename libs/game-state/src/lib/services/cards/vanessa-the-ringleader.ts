/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Vanessa the Ringleader (JAIL_407)
 * Prepare. After you play a card, get a random Battlecry minion. It costs (2) less.
 */
import { CardIds, CardType, GameTag, hasMechanic } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const VanessaTheRingleader: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.VanessaTheRingleader_JAIL_407],
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			VanessaTheRingleader.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && hasMechanic(c, GameTag.BATTLECRY),
			input.options,
		);
		return {
			possibleCards: possibleCards,
			cardType: CardType.MINION,
			mechanics: [GameTag.BATTLECRY],
		};
	},
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			VanessaTheRingleader.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && hasMechanic(c, GameTag.BATTLECRY),
			input.inputOptions,
		);
	},
};
