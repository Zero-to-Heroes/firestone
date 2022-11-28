import { readFile } from 'fs/promises';
import { replaceInFile } from 'replace-in-file';

const replaceVersion = async () => {
	console.log('[replace-version] reading current version');
	const packageJsonBuff = await readFile('./package.json');
	const packageJson = JSON.parse(packageJsonBuff.toString('utf8'));
	console.log('[replace-version] app version', packageJson.version);
	await replaceVersionInFile('manifest.json', '@app-version@', packageJson.version);
};

const replaceVersionInFile = async (filePath: string, placeholder: string, replacedBy: string) => {
	await replaceInFile({
		files: `dist/apps/legacy/${filePath}`,
		from: placeholder,
		to: replacedBy,
	});
};

replaceVersion();
