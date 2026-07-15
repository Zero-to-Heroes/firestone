const CARD_PLACEHOLDER_REGEX = /\{\{([A-Za-z][A-Za-z0-9_]*)\}\}/g;

export interface ReleaseNotesCardInfo {
	readonly name: string;
	readonly rarity?: string;
}

export const getReleaseNotesCardRarityClass = (rarity?: string): string => {
	switch (rarity?.toLowerCase()) {
		case 'legendary':
			return 'rarity-legendary';
		case 'epic':
			return 'rarity-epic';
		case 'rare':
			return 'rarity-rare';
		case 'common':
		case 'free':
		default:
			return 'rarity-common';
	}
};

export const replaceReleaseNotesCardPlaceholders = (
	markdown: string,
	getCard: (cardId: string) => ReleaseNotesCardInfo | undefined,
): string => {
	return markdown.replace(CARD_PLACEHOLDER_REGEX, (match, cardId: string) => {
		const card = getCard(cardId);
		if (!card) {
			return match;
		}
		const rarityClass = getReleaseNotesCardRarityClass(card.rarity);
		return `<span class="release-notes-card ${rarityClass}" data-card-id="${cardId}">${card.name}</span>`;
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
