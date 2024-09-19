import { SettingContext, SettingNode } from '../settings.types';
import { arenaSettings } from './arena/_arena-settings';
import { battlegroundsSettings } from './battlegrounds/_battlegrounds-settings';
import { decktrackerSettings } from './decktracker/_decktracker-settings';
import { generalSettings } from './general/_general-settings';
import { mercenariesSettings } from './mercenaries/_mercenaries-settings';

/**
 * TODO
 * - advanced settings toggle
 * - refresh for packs and achievements (in the Data section)
 * - Mods section (and only show it on beta version)
 * - Move all settings related to the BG sim to their own section
 * - Same for some overlays like banned tribes, minions list?
 * - Mercenaries Quest. It's quite a lot of work, and I don't think it's used
 */
export const settingsDefinition = (context: SettingContext): SettingNode => {
	return {
		id: 'root',
		name: context.i18n.translateString('settings.title'),
		keywords: null,
		children: [
			generalSettings(context),
			decktrackerSettings(context),
			battlegroundsSettings(context),
			arenaSettings(context),
			mercenariesSettings(context),
		],
	};
};

export const findNode = (node: SettingNode, id: string | undefined): SettingNode | null => {
	if (!id) {
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
