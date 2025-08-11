/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, Race } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { Card, GeneratingCard, GuessInfoInput } from './_card.type';

export const ForgottenMillenium: Card & GeneratingCard = {
	cardIds: [CardIds.ForgottenMillennium_TIME_615],
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			races: [Race.UNDEAD],
		};
	},
};
