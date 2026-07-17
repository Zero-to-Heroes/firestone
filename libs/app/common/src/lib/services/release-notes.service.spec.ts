import {
	buildDiscordReleaseNotes,
	getReleaseNotesAppLanguageLabel,
	getReleaseNotesAssetPath,
	getReleaseNotesCardRarityClass,
	getReleaseNotesDisplayLocale,
	getReleaseNotesGithubUrl,
	replaceReleaseNotesCardPlaceholders,
} from './release-notes.utils';

describe('release-notes utils', () => {
	it('builds localized asset paths', () => {
		expect(getReleaseNotesAssetPath('18.10.1', 'frFR')).toBe('assets/app-versions/frFR/18.10.1.md');
		expect(getReleaseNotesAssetPath('18.10.1', 'enUS')).toBe('assets/app-versions/18.10.1.md');
	});

	it('builds GitHub urls for localized and English files', () => {
		expect(getReleaseNotesGithubUrl('18.10.1', 'frFR')).toContain('/frFR/18.10.1.md');
		expect(getReleaseNotesGithubUrl('18.10.1', 'enUS')).toContain('/18.10.1.md');
		expect(getReleaseNotesGithubUrl('18.10.1', 'enUS')).not.toContain('/enUS/');
	});

	it('maps card rarities to css classes', () => {
		expect(getReleaseNotesCardRarityClass('Legendary')).toBe('rarity-legendary');
		expect(getReleaseNotesCardRarityClass('Epic')).toBe('rarity-epic');
		expect(getReleaseNotesCardRarityClass('Rare')).toBe('rarity-rare');
		expect(getReleaseNotesCardRarityClass('Common')).toBe('rarity-common');
		expect(getReleaseNotesCardRarityClass(undefined)).toBe('rarity-common');
	});

	it('replaces card placeholders with localized names and rarity classes', () => {
		const result = replaceReleaseNotesCardPlaceholders('Discarded by {{JAIL_509}}', (cardId) => {
			return cardId === 'JAIL_509'
				? { name: 'Godfrey the Betrayer', rarity: 'Legendary' }
				: undefined;
		});

		expect(result).toBe(
			'Discarded by <span class="release-notes-card rarity-legendary" data-card-id="JAIL_509">Godfrey the Betrayer</span>',
		);
	});

	it('keeps unknown card placeholders unchanged', () => {
		const result = replaceReleaseNotesCardPlaceholders('Unknown {{NOT_A_CARD}}', () => undefined);

		expect(result).toBe('Unknown {{NOT_A_CARD}}');
	});

	it('falls back to English asset path when locale is enUS', () => {
		expect(getReleaseNotesAssetPath('18.10.1', 'enUS')).not.toContain('/enUS/');
	});

	it('resolves the display locale from app locale and English preference', () => {
		expect(getReleaseNotesDisplayLocale('frFR', false)).toBe('frFR');
		expect(getReleaseNotesDisplayLocale('frFR', true)).toBe('enUS');
		expect(getReleaseNotesDisplayLocale('enUS', false)).toBe('enUS');
	});

	it('returns native app language labels for release notes links', () => {
		expect(getReleaseNotesAppLanguageLabel('frFR')).toBe('Français');
		expect(getReleaseNotesAppLanguageLabel('deDE')).toBe('Deutsch');
		expect(getReleaseNotesAppLanguageLabel('unknown')).toBe('unknown');
	});

	it('builds Discord release notes with resolved card names and section headers', () => {
		const result = buildDiscordReleaseNotes(
			'## Decktracker\n\n- Counter updates {{JAIL_474}}\n\n- Another item',
			'18.11.0',
			(cardId) => (cardId === 'JAIL_474' ? { name: 'Jade Guardians' } : undefined),
		);

		expect(result).toBe(
			'**Firestone 18.11.0 — Release notes**\n\n**Decktracker**\n- Counter updates Jade Guardians\n- Another item\n',
		);
	});
});
