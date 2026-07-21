import { CardIds, CardType } from '@firestone-hs/reference-data';
import { HighlightSide } from '@firestone/shared/framework/core';
import { SelectorInput, SelectorOutput } from '../card-highlight/cards-highlight-common.service';
import { and, entityIs, inPlay, side } from '../card-highlight/selectors';
import { getProcessedCard } from '../card-utils';
import { SelectorCard, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

export const ChronoLordEpoch: StaticGeneratingCard & SelectorCard = {
	cardIds: [CardIds.ChronoLordEpoch_TIME_714],
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const deckState = input.inputOptions.opponentDeckState;
		return deckState.cardsPlayedLastTurn
			.map((e) => getProcessedCard(e.cardId, e.entityId, deckState, input.allCards))
			.filter((c) => c.type?.toUpperCase() === CardType[CardType.MINION])
			.map((e) => e.id);
	},
	selector: (inputSide: HighlightSide) => {
		return (input: SelectorInput): SelectorOutput => {
			const deckState = input.side === 'opponent' ? input.deckState : input.opponentDeckState;
			if (!deckState) {
				return false;
			}
			const minionsPlayedLastTurn = deckState.cardsPlayedLastTurn
				.map((e) => ({
					refCard: getProcessedCard(e.cardId, e.entityId, deckState, input.allCards),
					entityId: e.entityId,
				}))
				.filter((c) => c.refCard.type?.toUpperCase() === CardType[CardType.MINION])
				.map((e) => ({ entityId: e.entityId, cardId: e.refCard.id }));
			return and(side(input.side), inPlay, entityIs(...minionsPlayedLastTurn))(input);
		};
	},
};
