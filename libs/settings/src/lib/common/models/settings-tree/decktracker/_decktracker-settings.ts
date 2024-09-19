import { SettingContext, SettingNode } from '../../settings.types';
import { decktrackerGlobalSettings } from './decktracker-settings-global';
import { decktrackerMulliganSettings } from './decktracker-settings-mulligan';
import { decktrackerOpponentDeckSettings } from './decktracker-settings-opponent-deck';
import { decktrackerYourDeckSettings } from './decktracker-settings-your-deck';

export const decktrackerSettings = (context: SettingContext): SettingNode => {
	return {
		id: 'decktracker-root',
		name: context.i18n.translateString('settings.menu.decktracker'),
		keywords: null,
		children: [
			decktrackerGlobalSettings(context),
			decktrackerYourDeckSettings(context),
			decktrackerOpponentDeckSettings(context),
			decktrackerMulliganSettings(context),
			decktrackerTurnTimerSettings(context),
		],
	};
};
