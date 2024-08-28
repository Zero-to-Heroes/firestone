import { BgsMinionTypesRules, Race } from '@firestone-hs/reference-data';
import { MinionInfo } from '../tier-enhancer';

export const getBoardTypesLock = (
	rule: BgsMinionTypesRules,
	playerCardId: string,
	boardComposition: readonly MinionInfo[],
	i18n: { translateString: (toTranslate: string, params?: any) => string },
): { ruleLock: boolean; ruleLockReasons: readonly string[] } => {
	const needBoardTypes = rule.needBoardTypes;
	if (rule.alwaysAvailableForHeroes?.includes(playerCardId)) {
		return { ruleLock: false, ruleLockReasons: null };
	}

	let ruleLock = false;
	let ruleLockReasons = null;
	for (const minionType of needBoardTypes) {
		if (compositionMatches(Race[minionType.toUpperCase()], boardComposition)) {
			return { ruleLock: false, ruleLockReasons: null };
		}
		ruleLock = true;
		ruleLockReasons = ruleLockReasons ?? [];
		ruleLockReasons.push(
			i18n.translateString(`battlegrounds.in-game.minions-list.rules.missing-board-type`, {
				type: i18n.translateString(`global.tribe.${minionType.toLowerCase()}`),
			}),
		);
	}
	return { ruleLock: ruleLock, ruleLockReasons: ruleLockReasons };
};

const compositionMatches = (targetTribe: Race, boardComposition: readonly MinionInfo[]): boolean => {
	let totalMatches = 0;
	for (const minion of boardComposition) {
		if (minion.tribes?.includes(targetTribe) || minion.tribes?.includes(Race.ALL)) {
			totalMatches++;
		}
	}
	return totalMatches >= 2;
};
