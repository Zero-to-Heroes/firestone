import { readFile } from 'fs/promises';
import { compressFolder } from './zip-tool';

const createOpk = async () => {
	console.log('[create-opk] reading current version');
	const packageJsonBuff = await readFile('./package.json');
	const packageJson = JSON.parse(packageJsonBuff.toString('utf8'));
	await compressFolder('dist/apps/legacy', `firestone_${packageJson.version}.opk`);
};

createOpk();
