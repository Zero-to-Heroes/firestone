/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/framework/core';
import { GuessedInfo } from '../../models/deck-card';
import { silverHandRecruitTokenIds } from '../card-highlight/selectors';
import { GeneratingCard } from './_card.type';

export const Teamwork: GeneratingCard = {
	cardIds: [TempCardIds.PaladinMend900Teamwork as unknown as CardIds],
	publicCreator: true,
	hasSequenceInfo: true,
	guessCardId: (): string | null => silverHandRecruitTokenIds[0] ?? null,
	guessInfo: (): GuessedInfo | null => ({
		cardType: CardType.MINION,
		possibleCards: [...silverHandRecruitTokenIds],
	}),
};
