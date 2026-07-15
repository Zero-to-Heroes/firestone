const CARD_PLACEHOLDER_REGEX = /\{\{([A-Za-z][A-Za-z0-9_]*)\}\}/g;

export const replaceReleaseNotesCardPlaceholders = (
	markdown: string,
	getCardName: (cardId: string) => string | undefined,
): string => {
	return markdown.replace(CARD_PLACEHOLDER_REGEX, (match, cardId: string) => {
		const cardName = getCardName(cardId);
		if (!cardName) {
			return match;
		}
		return `<span class="release-notes-card" data-card-id="${cardId}">${cardName}</span>`;
	});
};

export const getReleaseNotesAssetPath = (version: string, locale: string): string => {
	if (locale && locale !== 'enUS') {
		return `assets/app-versions/${locale}/${version}.md`;
	}
	return `assets/app-versions/${version}.md`;
};

export const getReleaseNotesGithubUrl = (version: string, locale: string): string => {
	const baseUrl =
		'https://github.com/Zero-to-Heroes/firestone/blob/master/libs/shared/assets/src/assets/app-versions';
	if (locale && locale !== 'enUS') {
		return `${baseUrl}/${locale}/${version}.md`;
	}
	return `${baseUrl}/${version}.md`;
};
