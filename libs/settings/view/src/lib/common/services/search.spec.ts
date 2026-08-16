import { Setting, SettingNode } from '@firestone/settings/services';
import { collectPrefFieldsFromNode, filterSettings, findFirstSelectableNode, nodeHasSpotlight } from './search';

const sampleSetting = (field: string, label: string): Setting =>
	({
		type: 'toggle',
		field: field as Setting['field'],
		label,
		tooltip: null,
	}) as Setting;

const leaf = (id: string, settings: Setting[]): SettingNode => ({
	id,
	name: id,
	keywords: null,
	children: null,
	sections: [
		{
			id: `${id}-section`,
			title: id,
			settings,
		},
	],
});

const root = (children: SettingNode[]): SettingNode => ({
	id: 'root',
	name: 'Settings',
	keywords: null,
	children,
});

describe('filterSettings new-only', () => {
	const tree = root([
		{
			id: 'battlegrounds',
			name: 'Battlegrounds',
			keywords: null,
			children: [
				leaf('battlegrounds-overlay', [
					sampleSetting('bgsEnableDarkGiftOverlay', 'Dark Gifts'),
					sampleSetting('bgsFullToggle', 'Enable Battlegrounds'),
				]),
				leaf('battlegrounds-general', [sampleSetting('bgsShowHeroTipsOverlay', 'Hero tips')]),
			],
		},
		{
			id: 'decktracker',
			name: 'Decktracker',
			keywords: null,
			children: [leaf('decktracker-your-deck', [sampleSetting('overlayEnableSecretsHelper', 'Secrets')])],
		},
	]);

	it('keeps only spotlighted settings and their ancestors', () => {
		const filtered = filterSettings(tree, {
			newOnly: true,
			spotlightPrefFields: new Set(['bgsEnableDarkGiftOverlay']),
			spotlightNodeIds: new Set(),
		});
		expect(filtered.children?.map((c) => c.id)).toEqual(['battlegrounds']);
		expect(filtered.children?.[0].children?.map((c) => c.id)).toEqual(['battlegrounds-overlay']);
		const overlay = filtered.children?.[0].children?.[0];
		const overlaySection = overlay?.sections?.[0];
		const overlaySettings =
			overlaySection && 'settings' in overlaySection ? (overlaySection.settings as Setting[]) : [];
		expect(overlaySettings.map((s) => s.field)).toEqual(['bgsEnableDarkGiftOverlay']);
	});

	it('keeps the whole page when the node itself is spotlighted', () => {
		const filtered = filterSettings(tree, {
			newOnly: true,
			spotlightPrefFields: new Set(),
			spotlightNodeIds: new Set(['battlegrounds-general']),
		});
		const general = filtered.children?.[0].children?.[0];
		expect(general?.id).toBe('battlegrounds-general');
		const generalSection = general?.sections?.[0];
		const generalSettings =
			generalSection && 'settings' in generalSection ? (generalSection.settings as Setting[]) : [];
		expect(generalSettings.map((s) => s.field)).toEqual(['bgsShowHeroTipsOverlay']);
	});

	it('returns an empty tree when nothing matches', () => {
		const filtered = filterSettings(tree, {
			newOnly: true,
			spotlightPrefFields: new Set(),
			spotlightNodeIds: new Set(),
		});
		expect(filtered.children?.length ?? 0).toBe(0);
	});

	it('still supports search-only filtering', () => {
		const filtered = filterSettings(tree, 'Dark Gifts');
		expect(filtered.children?.[0].children?.[0].id).toBe('battlegrounds-overlay');
	});

	it('detects spotlights on ancestor nav nodes', () => {
		expect(nodeHasSpotlight(tree.children![0], new Set(['bgsEnableDarkGiftOverlay']), new Set())).toBe(true);
		expect(nodeHasSpotlight(tree.children![1], new Set(['bgsEnableDarkGiftOverlay']), new Set())).toBe(false);
	});

	it('collects pref fields from a leaf node', () => {
		expect(collectPrefFieldsFromNode(tree.children![0].children![0])).toEqual([
			'bgsEnableDarkGiftOverlay',
			'bgsFullToggle',
		]);
	});

	it('finds the first selectable node', () => {
		expect(findFirstSelectableNode(tree)?.id).toBe('battlegrounds-overlay');
	});
});
