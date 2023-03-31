import { GameType } from '@firestone-hs/reference-data';
import { StatGameModeType } from '@firestone/stats/data-access';
import { LocalizationFacadeService } from '@services/localization-facade.service';

export const isDuels = (gameType: GameType | StatGameModeType): boolean => {
	return (
		gameType === GameType.GT_PVPDR ||
		gameType === GameType.GT_PVPDR_PAID ||
		gameType === 'duels' ||
		gameType === 'paid-duels'
	);
};

export const getDuelsModeName = (mode: 'duels' | 'paid-duels', i18n: LocalizationFacadeService): string => {
	switch (mode) {
		case 'duels':
			return i18n.translateString('global.game-mode.casual-duels');
		case 'paid-duels':
			return i18n.translateString('global.game-mode.heroic-duels');
	}
};
