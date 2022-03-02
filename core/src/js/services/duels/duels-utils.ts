import {
	allDuelsSignatureTreasures,
	allDuelsTreasureCardIds,
	CardIds,
	duelsActivePool2,
	duelsActivePool2UltraRare,
	duelsPassivePool2,
	duelsPassivePool2UltraRare,
	GameType,
} from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@services/cards-facade.service';
import { LocalizationFacadeService } from '@services/localization-facade.service';

const PASSIVES = [];

export const isDuels = (gameType: GameType): boolean => {
	return gameType === GameType.GT_PVPDR || gameType === GameType.GT_PVPDR_PAID;
};

export const isSignatureTreasure = (cardId: string, allCards: CardsFacadeService): boolean => {
	const card = allCards.getCard(cardId);
	return (
		allDuelsSignatureTreasures.includes(cardId as CardIds) ||
		(card && ['Minion', 'Spell'].includes(card.type) && card.id.startsWith('PVPDR_DMF_'))
	);
};

export const isPassive = (cardId: string, allCards: CardsFacadeService): boolean => {
	return PASSIVES.includes(cardId) || allCards.getCard(cardId)?.mechanics?.includes('DUNGEON_PASSIVE_BUFF');
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
