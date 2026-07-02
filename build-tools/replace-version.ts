import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { replaceInFile } from 'replace-in-file';

const PLACEHOLDER = '@app-version@';
const FLAVOR_PLACEHOLDER = '@app-flavor@';

// The standalone build flavor: `standalone` (free, ad-supported) or `standalone-premium` (premium-only).
// Defaults to the free build so plain/dev builds behave as the broad version.
const ALLOWED_FLAVORS = ['standalone', 'standalone-premium'];
const flavor = ALLOWED_FLAVORS.includes(process.env.FIRESTONE_FLAVOR ?? '')
	? (process.env.FIRESTONE_FLAVOR as string)
	: 'standalone';

const replaceVersion = async () => {
	console.log('[replace-version] reading current version');
	const packageJsonBuff = await readFile('./package.json');
	const packageJson = JSON.parse(packageJsonBuff.toString('utf8'));
	const version = packageJson.version;
	console.log('[replace-version] app version', version);
	console.log('[replace-version] app flavor', flavor);

	const targets = ['dist/apps/legacy/manifest.json', 'dist/apps/electron-app/package.json'];

	for (const filePath of targets) {
		if (!existsSync(filePath)) {
			console.log(`[replace-version] skipping ${filePath} (not found)`);
			continue;
		}
		await replaceVersionInFile(filePath, PLACEHOLDER, version);
		// Only the electron app package.json carries the flavor placeholder; replaceInFile is a no-op otherwise.
		await replaceVersionInFile(filePath, FLAVOR_PLACEHOLDER, flavor);
		console.log(`[replace-version] updated ${filePath}`);
	}
};

const replaceVersionInFile = async (filePath: string, placeholder: string, replacedBy: string) => {
	await replaceInFile({
		files: filePath,
		from: placeholder,
		to: replacedBy,
	});
};

replaceVersion();
