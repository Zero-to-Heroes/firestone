import { CardIds, CardType, GameTag, hasMechanic } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

// Murozond (TOT_332)
// "<b>Rewind</b> <b>Battlecry:</b> Get a random <b>Fabled</b> minion and its bundled cards."
export const Murozond: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Murozond_TOT_332],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			Murozond.cardIds[0],
			input.allCards,
			(c) =>
				hasCorrectType(c, CardType.MINION) &&
				(hasMechanic(c, GameTag.FABLED) || hasMechanic(c, GameTag.FABLED_PLUS)),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.MINION,
			possibleCards: filterCards(
				Murozond.cardIds[0],
				input.allCards,
				(c) =>
					hasCorrectType(c, CardType.MINION) &&
					(hasMechanic(c, GameTag.FABLED) || hasMechanic(c, GameTag.FABLED_PLUS)),
				input.options,
			),
		};
	},
};
