import { BgsMinionTypesRules, Race } from '@firestone-hs/reference-data';
import { MinionInfo } from '../tier-enhancer';

const expectedQuantity = 2;

export const getBoardTypesLock = (
	rule: BgsMinionTypesRules,
	playerCardId: string,
	boardComposition: readonly MinionInfo[],
	i18n: { translateString: (toTranslate: string, params?: any) => string },
): { ruleLock: boolean; ruleLockReasons: readonly string[] | null } => {
	if (rule.alwaysAvailableForHeroes?.includes(playerCardId)) {
		return { ruleLock: false, ruleLockReasons: null };
	}

	let ruleLock = false;
	let ruleLockReasons: string[] | null = null;
	const needBoardTypes = rule.needBoardTypes ?? [];
	const missingTypes: string[] = [];
	for (const minionType of needBoardTypes) {
		if (compositionMatches(Race[minionType.toUpperCase()], boardComposition)) {
			return { ruleLock: false, ruleLockReasons: null };
		}
		missingTypes.push(minionType);
	}

	ruleLock = true;
	ruleLockReasons = ruleLockReasons ?? [];
	const missingTypeStrings = missingTypes
		.map((type) => i18n.translateString(`global.tribe.${type.toLowerCase()}`))
		.map((type) =>
			i18n.translateString(`battlegrounds.in-game.minions-list.rules.missing-board-expected-quantity`, {
				quantity: expectedQuantity,
				minionType: type,
			}),
		)
		.join(i18n.translateString(`battlegrounds.in-game.minions-list.rules.missing-board-linked`));
	ruleLockReasons.push(
		i18n.translateString(`battlegrounds.in-game.minions-list.rules.missing-board-type`, {
			typesAndQuantity: missingTypeStrings,
		}),
	);
	return { ruleLock: ruleLock, ruleLockReasons: ruleLockReasons };
};

const compositionMatches = (targetTribe: Race, boardComposition: readonly MinionInfo[]): boolean => {
	let totalMatches = 0;
	for (const minion of boardComposition) {
		if (minion.tribes?.includes(targetTribe) || minion.tribes?.includes(Race.ALL)) {
			totalMatches++;
		}
	}
	return totalMatches >= expectedQuantity;
};
