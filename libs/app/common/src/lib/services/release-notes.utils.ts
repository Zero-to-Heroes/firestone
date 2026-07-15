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

export const replaceReleaseNotesCardPlaceholdersWithNames = (
	markdown: string,
	getCard: (cardId: string) => ReleaseNotesCardInfo | undefined,
): string => {
	return markdown.replace(CARD_PLACEHOLDER_REGEX, (match, cardId: string) => {
		const card = getCard(cardId);
		return card?.name ?? match;
	});
};

export const convertReleaseNotesMarkdownToDiscord = (markdown: string, version: string): string => {
	const lines = markdown.trim().split(/\r?\n/);
	const result: string[] = [`**Firestone ${version} — Release notes**`, ''];

	const isListItem = (line: string | undefined): boolean => !!line && /^-\s/.test(line);
	const isSectionHeader = (line: string | undefined): boolean => !!line && /^##\s+/.test(line);
	const findNextNonEmpty = (fromIndex: number): string | undefined => {
		for (let i = fromIndex + 1; i < lines.length; i++) {
			if (lines[i].trim()) {
				return lines[i];
			}
		}
		return undefined;
	};

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];

		if (!line.trim()) {
			const previous = result[result.length - 1];
			const next = findNextNonEmpty(i);

			if (isListItem(previous) && isListItem(next)) {
				continue;
			}

			if (previous?.startsWith('**') && previous.endsWith('**') && isListItem(next)) {
				continue;
			}

			if (isSectionHeader(next) && previous?.startsWith('**') && previous.endsWith('**')) {
				continue;
			}

			if (result[result.length - 1] === '') {
				continue;
			}

			result.push('');
			continue;
		}

		const headerMatch = line.match(/^##\s+(.+)$/);
		if (headerMatch) {
			if (result.length > 1 && result[result.length - 1] !== '') {
				result.push('');
			}
			result.push(`**${headerMatch[1]}**`);
			continue;
		}

		result.push(line);
	}

	return `${result.join('\n').trimEnd()}\n`;
};

export const buildDiscordReleaseNotes = (
	markdown: string,
	version: string,
	getCard: (cardId: string) => ReleaseNotesCardInfo | undefined,
): string => {
	const withCardNames = replaceReleaseNotesCardPlaceholdersWithNames(markdown, getCard);
	return convertReleaseNotesMarkdownToDiscord(withCardNames, version);
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
