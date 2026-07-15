import { existsSync } from 'fs';
import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import {
	buildDiscordReleaseNotes,
	ReleaseNotesCardInfo,
} from '../libs/app/common/src/lib/services/release-notes.utils';

const APP_VERSIONS_DIR = path.join(__dirname, '../libs/shared/assets/src/assets/app-versions');
const DISCORD_DIR = path.join(APP_VERSIONS_DIR, 'discord');

const resolveCardsShortPath = (): string => {
	const env = process.env['HS_REFERENCE_CARDS_JSON_PATH']?.trim();
	if (env?.length && existsSync(env)) {
		return env;
	}

	const candidates = [
		path.join(__dirname, '../../hs-reference-data/src/cards_short.json'),
		path.join(process.cwd(), '../hs-reference-data/src/cards_short.json'),
	];

	for (const candidate of candidates) {
		if (existsSync(candidate)) {
			return candidate;
		}
	}

	throw new Error(
		`cards_short.json not found. Clone hs-reference-data next to firestone, or set HS_REFERENCE_CARDS_JSON_PATH.`,
	);
};

const loadCardsById = async (): Promise<Map<string, ReleaseNotesCardInfo>> => {
	const cardsPath = resolveCardsShortPath();
	const cards = JSON.parse(await readFile(cardsPath, 'utf8')) as Array<{
		id: string;
		name: string;
		rarity?: string;
	}>;
	return new Map(cards.map((card) => [card.id, { name: card.name, rarity: card.rarity }]));
};

const listEnglishReleaseNoteVersions = async (): Promise<string[]> => {
	const { readdir } = await import('fs/promises');
	const files = await readdir(APP_VERSIONS_DIR);
	return files
		.filter((file) => file.endsWith('.md') && file !== 'README.md')
		.map((file) => file.replace(/\.md$/, ''))
		.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
};

const generateForVersion = async (
	version: string,
	getCard: (cardId: string) => ReleaseNotesCardInfo | undefined,
): Promise<void> => {
	const sourcePath = path.join(APP_VERSIONS_DIR, `${version}.md`);
	if (!existsSync(sourcePath)) {
		console.log(`[discord-release-notes] skipping ${version} (no English source at ${sourcePath})`);
		return;
	}

	const markdown = await readFile(sourcePath, 'utf8');
	const discordContent = buildDiscordReleaseNotes(markdown, version, getCard);
	const outputPath = path.join(DISCORD_DIR, `${version}.txt`);

	await mkdir(DISCORD_DIR, { recursive: true });
	await writeFile(outputPath, discordContent, 'utf8');
	console.log(`[discord-release-notes] wrote ${outputPath}`);
};

const main = async () => {
	const args = process.argv.slice(2);
	const generateAll = args.includes('--all');
	const versionArg = args.find((arg) => !arg.startsWith('--'));

	const packageJson = JSON.parse(await readFile(path.join(__dirname, '../package.json'), 'utf8'));
	const currentVersion = packageJson.version as string;

	const cardsById = await loadCardsById();
	const getCard = (cardId: string) => cardsById.get(cardId);

	const versions = generateAll
		? await listEnglishReleaseNoteVersions()
		: [versionArg ?? currentVersion];

	console.log(`[discord-release-notes] generating ${versions.join(', ')}`);
	for (const version of versions) {
		await generateForVersion(version, getCard);
	}
};

main().catch((error) => {
	console.error('[discord-release-notes] failed', error);
	process.exit(1);
});
