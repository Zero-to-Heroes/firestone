import { SettingContext, SettingNode } from '@firestone/settings/services';
import { achievementsSettings } from './achievements/_achievements-settings';
import { arenaSettings } from './arena/_arena-settings';
import { battlegroundsSettings } from './battlegrounds/_battlegrounds-settings';
import { collectionSettings } from './collection/_collection-settings';
import { decktrackerSettings } from './decktracker/_decktracker-settings';
import { applicationSettings } from './general/_general-settings';
import { globalSettings } from './global/_global-settings';
import { integrationsSettings } from './integrations/_integrations-settings';
import { mercenariesSettings } from './mercenaries/_mercenaries-settings';
import { addonsSettings } from './addons/_addons-settings';
import { modsSettings } from './mods/_mods-settings';
import { replaySettings } from './replay/_replay-settings';
import { troubleshootingSettings } from './troubleshooting/_troubleshooting-settings';

/**
 * TODO
 * - Mercenaries Quest. It's quite a lot of work, and I don't think it's used
 */
export const settingsDefinition = (context: SettingContext): SettingNode => {
	const result = {
		id: 'root',
		name: context.i18n.translateString('settings.title'),
		keywords: null,
		children: [
			applicationSettings(context),
			globalSettings(context),
			decktrackerSettings(context),
			battlegroundsSettings(context),
			arenaSettings(context),
			mercenariesSettings(context),
			replaySettings(context),
			collectionSettings(context),
			achievementsSettings(context),
			integrationsSettings(context),
			troubleshootingSettings(context),
			modsSettings(context),
			addonsSettings(context),
		].filter((c) => !!c) as SettingNode[],
	};
	return result;
};

export const findNode = (node: SettingNode | null, id: string | undefined | null): SettingNode | null => {
	if (!id || !node) {
		return null;
	}
	if (node.id === id) {
		return node;
	}
	if (node.children) {
		for (const child of node.children) {
			const result = findNode(child, id);
			if (result) {
				return result;
			}
		}
	}
	return null;
};
