/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, GameTag, hasMechanic, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const LeyWalker: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.LeyWalker_MEND_501],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			CardIds.LeyWalker_MEND_501,
			input.allCards,
			(c: ReferenceCard) => hasMechanic(c, GameTag.LEYLINE),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			CardIds.LeyWalker_MEND_501,
			input.allCards,
			(c: ReferenceCard) => hasMechanic(c, GameTag.LEYLINE),
			input.options,
		);
		return {
			possibleCards,
			mechanics: [GameTag.LEYLINE],
		};
	},
};
