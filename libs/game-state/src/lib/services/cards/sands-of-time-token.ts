/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, GameTag } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const SandsOfTimeToken: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.SandsOfTime_SandsOfTimeToken_TIME_EVENT_999t],
	publicCreator: true,
	guessInfo: ({ card, options, allCards, deckState }: GuessInfoInput): GuessedInfo | null => {
		const isShattered =
			options?.tags?.some((t) => t.Name === GameTag.SHATTERED && t.Value === 1) ||
			card.tags?.[GameTag.SHATTERED] === 1;
		if (!isShattered) {
			return null;
		}
		const currentClass = deckState.getCurrentClassEnum() ?? null;
		const possibleCards = filterCards(
			SandsOfTimeToken.cardIds[0],
			allCards,
			(c) => hasCorrectType(c, CardType.SPELL) && hasCorrectClass(c, currentClass),
			options,
		);
		return {
			cardClasses: currentClass ? [currentClass] : undefined,
			cardType: CardType.SPELL,
			possibleCards,
		};
	},
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const currentClass = input.inputOptions.deckState.getCurrentClassEnum() ?? null;
		return filterCards(
			SandsOfTimeToken.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.SPELL) && hasCorrectClass(c, currentClass),
			input.inputOptions,
		);
	},
};
