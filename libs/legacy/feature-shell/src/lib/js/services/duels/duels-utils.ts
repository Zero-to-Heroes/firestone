import {
	allDuelsSignatureTreasures,
	allDuelsTreasureCardIds,
	CardIds,
	duelsActivePool2,
	duelsActivePool2UltraRare,
	duelsPassivePool1,
	duelsPassivePool2,
	duelsPassivePool2UltraRare,
	GameType,
} from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { StatGameModeType } from '@firestone/stats/data-access';
import { LocalizationFacadeService } from '@services/localization-facade.service';

const PASSIVES = [...duelsPassivePool1, ...duelsPassivePool2, ...duelsPassivePool2UltraRare];

export const isDuels = (gameType: GameType | StatGameModeType): boolean => {
	return (
		gameType === GameType.GT_PVPDR ||
		gameType === GameType.GT_PVPDR_PAID ||
		gameType === 'duels' ||
		gameType === 'paid-duels'
	);
};

export const isSignatureTreasure = (cardId: string, allCards: CardsFacadeService): boolean => {
	return allDuelsSignatureTreasures.includes(cardId as CardIds);
};

export const isPassive = (cardId: string, allCards: CardsFacadeService): boolean => {
	return (
		PASSIVES.includes(cardId as CardIds) || allCards.getCard(cardId)?.mechanics?.includes('DUNGEON_PASSIVE_BUFF')
	);
};

// https://hearthstone.fandom.com/wiki/Duels#Current_season
export const duelsTreasureRank = (cardId: string): number => {
	if (!cardId) {
		return 0;
	}

	if (!allDuelsTreasureCardIds.includes(cardId as CardIds)) {
		console.error('Incorrect config for duels card IDs?', cardId);
	}
	if (duelsPassivePool2.includes(cardId as CardIds) || duelsActivePool2.includes(cardId as CardIds)) {
		return 2;
	} else if (
		duelsPassivePool2UltraRare.includes(cardId as CardIds) ||
		duelsActivePool2UltraRare.includes(cardId as CardIds)
	) {
		return 3;
	}
	return 1;
};

export const getDuelsModeName = (mode: 'duels' | 'paid-duels', i18n: LocalizationFacadeService): string => {
	switch (mode) {
		case 'duels':
			return i18n.translateString('global.game-mode.casual-duels');
		case 'paid-duels':
			return i18n.translateString('global.game-mode.heroic-duels');
	}
};
