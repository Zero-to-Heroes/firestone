import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { replaceInFile } from 'replace-in-file';

const PLACEHOLDER = '@app-version@';

const replaceVersion = async () => {
	console.log('[replace-version] reading current version');
	const packageJsonBuff = await readFile('./package.json');
	const packageJson = JSON.parse(packageJsonBuff.toString('utf8'));
	const version = packageJson.version;
	console.log('[replace-version] app version', version);

	const targets = ['dist/apps/legacy/manifest.json', 'dist/apps/electron-app/package.json'];

	for (const filePath of targets) {
		if (!existsSync(filePath)) {
			console.log(`[replace-version] skipping ${filePath} (not found)`);
			continue;
		}
		await replaceVersionInFile(filePath, PLACEHOLDER, version);
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
