import {
	getReleaseNotesAssetPath,
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

	it('replaces card placeholders with localized names', () => {
		const result = replaceReleaseNotesCardPlaceholders('Discarded by {{JAIL_509}}', (cardId) => {
			return cardId === 'JAIL_509' ? 'Godfrey the Betrayer' : undefined;
		});

		expect(result).toBe(
			'Discarded by <span class="release-notes-card" data-card-id="JAIL_509">Godfrey the Betrayer</span>',
		);
	});

	it('keeps unknown card placeholders unchanged', () => {
		const result = replaceReleaseNotesCardPlaceholders('Unknown {{NOT_A_CARD}}', () => undefined);

		expect(result).toBe('Unknown {{NOT_A_CARD}}');
	});

	it('falls back to English asset path when locale is enUS', () => {
		expect(getReleaseNotesAssetPath('18.10.1', 'enUS')).not.toContain('/enUS/');
	});
});
