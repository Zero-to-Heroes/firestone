import { GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { MinionInfo } from '../tier-enhancer';

export const getMechanicsLock = (
	boardComposition: readonly MinionInfo[],
	mechanic: GameTag,
	thresholdInclusive: number,
	allCards: CardsFacadeService,
	i18n: { translateString: (toTranslate: string, params?: any) => string },
): { ruleLock: boolean; ruleLockReasons: readonly string[] | null } => {
	if (boardComposition?.filter((m) => hasMechanic(m, mechanic, allCards)).length >= thresholdInclusive) {
		return { ruleLock: false, ruleLockReasons: null };
	}
	return {
		ruleLock: true,
		ruleLockReasons: [
			i18n.translateString('battlegrounds.in-game.minions-list.rules.mechanics', {
				numberOfMinions: thresholdInclusive,
				mechanic: i18n.translateString(`global.mechanics.${GameTag[mechanic].toLowerCase()}`),
			}),
		],
	};
};

const hasMechanic = (minion: MinionInfo, mechanic: GameTag, allCards: CardsFacadeService): boolean => {
	return allCards.getCard(minion.cardId)?.mechanics?.includes(GameTag[mechanic]);
};
