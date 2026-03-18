/* eslint-disable no-mixed-spaces-and-tabs */
// Supply Run (CATA_820 / CATA_820t)
// 4-cost Spell
// Shatter: Draw 3 minions. Give minions in your hand +2/+2.
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput } from './_card.type';

export const SupplyRun: GeneratingCard = {
	cardIds: [CardIds.SupplyRun_CATA_820, CardIds.SupplyRun_SupplyRunToken_CATA_820t],
	publicTutor: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.MINION,
		};
	},
};
