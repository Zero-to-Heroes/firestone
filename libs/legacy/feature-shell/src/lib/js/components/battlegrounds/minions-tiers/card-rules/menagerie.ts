import { Race } from '@firestone-hs/reference-data';
import { pickRandom } from '@legacy-import/src/lib/js/services/utils';
import { MinionInfo } from '../tier-enhancer';

const numberOfRandomPicks = 15;

export const getMenagerieLock = (
	boardComposition: readonly MinionInfo[],
	i18n: { translateString: (toTranslate: string, params?: any) => string },
): { ruleLock: boolean; ruleLockReasons: readonly string[] } => {
	for (let i = 0; i < numberOfRandomPicks; i++) {
		const totalTribes = getRandomTribes(boardComposition);
		if (totalTribes >= 3) {
			return { ruleLock: false, ruleLockReasons: null };
		}
	}
	return {
		ruleLock: true,
		ruleLockReasons: [i18n.translateString('battlegrounds.in-game.minions-list.rules.menagerie')],
	};
};

// Easier than figuring out the correct algorithm, and doesn't take much time if we don't do too many repetitions
const getRandomTribes = (boardComposition: readonly MinionInfo[]): number => {
	const tribesWithAll = boardComposition.filter((minion) => minion.tribes?.includes(Race.ALL)).length;
	const tribesOnBoard: Race[] = [];
	const minionTribesWithoutAll = boardComposition.filter(
		(minion) => minion.tribes && !minion.tribes.includes(Race.ALL),
	);
	for (const minion of minionTribesWithoutAll) {
		const missingTribes = minion.tribes.filter((tribe) => !tribesOnBoard.includes(tribe));
		if (missingTribes.length > 0) {
			tribesOnBoard.push(pickRandom(missingTribes));
		}
	}
	return tribesWithAll + tribesOnBoard.length;
};
