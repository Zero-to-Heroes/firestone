import { BgsCompAdvice, TribeList } from '@firestone-hs/content-craetor-input';
import { Race } from '@firestone-hs/reference-data';

export const buildCompositions = (
	availableTribes: readonly Race[],
	strategies: readonly BgsCompAdvice[],
): readonly BgsCompAdvice[] => {
	// return strategies;
	return (
		strategies?.filter((s) => {
			const result = isAvailableStat(s.needAnyTribeCombinaisonInLobby, availableTribes);
			console.debug('isAvailableStat', s.needAnyTribeCombinaisonInLobby, availableTribes, result);
			return result;
		}) ?? []
	);
};

const isAvailableStat = (tribesCombinations: readonly TribeList[], availableTribes: readonly Race[]): boolean => {
	return (
		!tribesCombinations?.length ||
		!availableTribes?.length ||
		tribesCombinations.some((tribes) => isAvailableTribes(tribes, availableTribes))
	);
};

const isAvailableTribes = (tribes: TribeList, availableTribes: readonly Race[]): boolean => {
	return tribes.every((tribe) => availableTribes.includes(Race[tribe]));
};
