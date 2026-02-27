import { CardIds } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { broxigarFablePackage, fablePackages, kingLlaneFablePackage } from '../card-utils';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

// Murozond (TOT_332)
// "<b>Rewind</b> <b>Battlecry:</b> Get a random <b>Fabled</b> minion and its bundled cards."
// Garona and Broxigar packages cannot be obtained from Murozond
// Lazy-evaluated to avoid circular dependency: card-utils -> _mapping -> _barrel -> murozond -> card-utils
let _murozondFablePackages: string[] | null = null;
const getMurozondFablePackages = (): string[] => {
	if (!_murozondFablePackages) {
		_murozondFablePackages = fablePackages
			.filter((p) => p !== kingLlaneFablePackage && p !== broxigarFablePackage)
			.flat();
	}
	return _murozondFablePackages;
};

export const Murozond: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Murozond_TOT_332],
	publicCreator: true,
	dynamicPool: (_input: StaticGeneratingCardInput) => {
		return getMurozondFablePackages();
	},
	guessInfo: (_input: GuessInfoInput): GuessedInfo | null => {
		return {
			// No cardType specified since Murozond can generate different types:
			// the Fabled minion itself + bundled cards (which can be spells, weapons, etc.)
			possibleCards: getMurozondFablePackages(),
		};
	},
};
