import { CardIds } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { fablePackages } from '../card-utils';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

// All cards from Fabled packages (Fabled minions + their bundled cards)
const fabledPackagePool: readonly string[] = fablePackages.flat();

// Murozond (TOT_332)
// "<b>Rewind</b> <b>Battlecry:</b> Get a random <b>Fabled</b> minion and its bundled cards."
export const Murozond: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Murozond_TOT_332],
	publicCreator: true,
	dynamicPool: (_input: StaticGeneratingCardInput) => {
		return fabledPackagePool;
	},
	guessInfo: (_input: GuessInfoInput): GuessedInfo | null => {
		return {
			// No cardType specified since Murozond can generate different types:
			// the Fabled minion itself + bundled cards (which can be spells, weapons, etc.)
			possibleCards: fabledPackagePool,
		};
	},
};
