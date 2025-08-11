/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput } from './_card.type';

export const YrelBeaconOfHope: GeneratingCard = {
	cardIds: [CardIds.YrelBeaconOfHope_GDB_141],
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			possibleCards: [CardIds.LibramOfJustice_BT_011, CardIds.LibramOfHope, CardIds.LibramOfWisdom_BT_025],
		};
	},
};
