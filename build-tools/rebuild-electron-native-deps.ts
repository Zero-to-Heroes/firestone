import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

const owElectronPkg = require('../node_modules/@overwolf/ow-electron/package.json') as {
	electronVersion: string;
};
const electronVersion = owElectronPkg.electronVersion;
const appDir = join(__dirname, '../dist/apps/electron-app');
const nativeModules = ['better-sqlite3', 'uiohook-napi'] as const;

if (!existsSync(appDir)) {
	console.error(`[rebuild-electron-native-deps] ${appDir} not found — run nx build electron-app first`);
	process.exit(1);
}

console.log(`[rebuild-electron-native-deps] rebuilding for Electron ${electronVersion}`);

for (const moduleName of nativeModules) {
	const moduleDir = join(appDir, 'node_modules', moduleName);
	if (!existsSync(moduleDir)) {
		console.log(`[rebuild-electron-native-deps] skipping ${moduleName} (not installed)`);
		continue;
	}
	console.log(`[rebuild-electron-native-deps] rebuilding ${moduleName}`);
	execSync(
		`npx electron-rebuild --version=${electronVersion} --module-dir="${appDir}" -o ${moduleName} -f`,
		{ stdio: 'inherit' },
	);
}

console.log('[rebuild-electron-native-deps] done');
