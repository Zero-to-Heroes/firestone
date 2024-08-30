export const getTavernTier3Lock = (
	tavernLevel: number,
	i18n: { translateString: (toTranslate: string, params?: any) => string },
): { ruleLock: boolean; ruleLockReasons: readonly string[] | null } => {
	if (tavernLevel >= 3) {
		return { ruleLock: false, ruleLockReasons: null };
	}
	return {
		ruleLock: true,
		ruleLockReasons: [i18n.translateString('battlegrounds.in-game.minions-list.rules.tavern-level', { target: 3 })],
	};
};
