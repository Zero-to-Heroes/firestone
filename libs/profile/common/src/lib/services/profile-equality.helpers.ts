import {
	CardsForSet,
	ProfileAchievementCategory,
	ProfileBgHeroStat,
	ProfileClassProgress,
	ProfilePackStat,
	ProfileSet,
	ProfileWinsForMode,
} from '@firestone-hs/api-user-profile';

export const equalProfileAchievementCategory = (
	a: ProfileAchievementCategory | null | undefined,
	b: ProfileAchievementCategory | null | undefined,
): boolean => {
	if (!a && !b) {
		return true;
	}
	if (!a || !b) {
		return false;
	}
	if (a.id !== b.id) {
		return false;
	}
	return (
		a.availablePoints === b.availablePoints &&
		a.completedAchievements === b.completedAchievements &&
		a.id === b.id &&
		a.points === b.points &&
		a.totalAchievements === b.totalAchievements
	);
};

export const equalProfileBgHeroStat = (
	a: ProfileBgHeroStat | null | undefined,
	b: ProfileBgHeroStat | null | undefined,
): boolean => {
	if (!a && !b) {
		return true;
	}
	if (!a || !b) {
		return false;
	}
	if (a.heroCardId !== b.heroCardId) {
		return false;
	}
	return a.gamesPlayed === b.gamesPlayed && a.top1 === b.top1 && a.top4 === b.top4 && a.heroCardId === b.heroCardId;
};

export const equalProfileSet = (a: ProfileSet | null | undefined, b: ProfileSet | null | undefined): boolean => {
	if (!a && !b) {
		return true;
	}
	if (!a || !b) {
		return false;
	}
	if (a.id !== b.id) {
		return false;
	}
	return (
		equalCardsForSet(a.global, b.global) &&
		equalCardsForSet(a.vanilla, b.vanilla) &&
		equalCardsForSet(a.golden, b.golden) &&
		equalCardsForSet(a.diamond, b.diamond) &&
		equalCardsForSet(a.signature, b.signature)
	);
};

const equalCardsForSet = (a: CardsForSet | null | undefined, b: CardsForSet | null | undefined): boolean => {
	if (!a && !b) {
		return true;
	}
	if (!a || !b) {
		return false;
	}
	return a.common === b.common && a.epic === b.epic && a.legendary === b.legendary && a.rare === b.rare;
};

export const equalProfilePackStat = (
	a: ProfilePackStat | null | undefined,
	b: ProfilePackStat | null | undefined,
): boolean => {
	if (!a && !b) {
		return true;
	}
	if (!a || !b) {
		return false;
	}
	if (a.id !== b.id) {
		return false;
	}
	return a.totalObtained === b.totalObtained && a.id === b.id;
};

const equalProfileWinsForModeInfo = (
	a: ProfileWinsForMode | null | undefined,
	b: ProfileWinsForMode | null | undefined,
): boolean => {
	if (!a && !b) {
		return true;
	}
	if (!a || !b) {
		return false;
	}
	if (a.mode !== b.mode) {
		return false;
	}
	return a.wins === b.wins && a.losses === b.losses && a.ties === b.ties && a.mode === b.mode;
};

/** Compares arrays of ProfileWinsForMode */
export const equalProfileWinsForMode = (
	a: readonly ProfileWinsForMode[] | null | undefined,
	b: readonly ProfileWinsForMode[] | null | undefined,
): boolean => {
	if (!a && !b) {
		return true;
	}
	if (!a || !b) {
		return false;
	}
	if (a.length !== b.length) {
		return false;
	}
	return a.every((info, index) => equalProfileWinsForModeInfo(info, b[index]));
};

export const equalProfileClassProgress = (
	a: ProfileClassProgress | null | undefined,
	b: ProfileClassProgress | null | undefined,
): boolean => {
	if (!a && !b) {
		return true;
	}
	if (!a || !b) {
		return false;
	}
	if (a.playerClass !== b.playerClass) {
		return false;
	}
	return (
		a.level === b.level &&
		a.wins === b.wins &&
		a.losses === b.losses &&
		a.ties === b.ties &&
		a.playerClass === b.playerClass &&
		equalProfileWinsForMode(a.winsForModes, b.winsForModes)
	);
};
