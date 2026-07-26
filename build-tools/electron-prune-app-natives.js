/**
 * Prepare dist/apps/electron-app before Overwolf integrity signing + pack.
 *
 * Used as electron-builder `afterExtract` so it runs AFTER installAppDependencies
 * / native rebuild and BEFORE Overwolf signing.
 *
 * Do NOT use afterPack for stripping: Overwolf signs during pack, and mutating
 * win-unpacked afterward causes owepm "invalid verification".
 *
 * Also finalizes package.json (adds electronVersion, applies the same cleanup as
 * ow-electron-builder) BEFORE Overwolf hashes it. Otherwise the builder injects
 * electronVersion only when packing the asar, so _metadata.json no longer matches
 * and runtime logs: "package manager stopped by renderer - invalid verification".
 *
 * Also runnable as a CLI before the builder:
 *   node ./build-tools/electron-prune-app-natives.js
 */
const fs = require('fs');
const path = require('path');

const IGNORED_PACKAGE_METADATA = new Set([
	'dist',
	'gitHead',
	'build',
	'jspm',
	'ava',
	'xo',
	'nyc',
	'eslintConfig',
	'contributors',
	'bundleDependencies',
	'tags',
]);

function removeDir(dirPath) {
	if (fs.existsSync(dirPath)) {
		fs.rmSync(dirPath, { recursive: true, force: true });
		console.log(`  Removed: ${dirPath}`);
	}
}

function removeFiles(dirPath, patterns) {
	if (!fs.existsSync(dirPath)) {
		return;
	}

	const files = fs.readdirSync(dirPath);
	for (const file of files) {
		const filePath = path.join(dirPath, file);
		const stat = fs.statSync(filePath);

		if (stat.isDirectory()) {
			removeFiles(filePath, patterns);
		} else {
			for (const pattern of patterns) {
				if (pattern instanceof RegExp ? pattern.test(file) : file === pattern) {
					fs.unlinkSync(filePath);
					console.log(`  Removed: ${filePath}`);
					break;
				}
			}
		}
	}
}

function getDirSize(dirPath) {
	let size = 0;
	if (!fs.existsSync(dirPath)) {
		return 0;
	}

	const files = fs.readdirSync(dirPath);
	for (const file of files) {
		const filePath = path.join(dirPath, file);
		const stat = fs.statSync(filePath);
		if (stat.isDirectory()) {
			size += getDirSize(filePath);
		} else {
			size += stat.size;
		}
	}
	return size;
}

function resolveOwElectronVersion() {
	const candidates = [
		path.join(process.cwd(), 'node_modules', '@overwolf', 'ow-electron', 'package.json'),
		path.join(process.cwd(), 'node_modules', 'electron', 'package.json'),
	];
	for (const pkgPath of candidates) {
		try {
			if (fs.existsSync(pkgPath)) {
				const version = require(pkgPath).version;
				if (version) {
					return version;
				}
			}
		} catch {
			// try next
		}
	}
	return null;
}

function resolveElectronMajorVersion() {
	const version = resolveOwElectronVersion();
	return version ? version.split('.')[0] : null;
}

/**
 * Mirror ow-electron-builder fileTransformer cleanup + electronVersion injection
 * so Overwolf signs the same package.json bytes that end up in the asar.
 */
function finalizePackageJsonForOwSigning(appDir) {
	const pkgPath = path.join(appDir, 'package.json');
	if (!fs.existsSync(pkgPath)) {
		console.log(`  No package.json at ${pkgPath}, skipping finalize.`);
		return;
	}

	const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
	const electronVersion = resolveOwElectronVersion();
	if (!electronVersion) {
		throw new Error('[prepare] Could not resolve @overwolf/ow-electron version for package.json');
	}

	for (const prop of Object.keys(pkg)) {
		if (
			prop[0] === '_' ||
			IGNORED_PACKAGE_METADATA.has(prop) ||
			prop === 'scripts' ||
			prop === 'keywords' ||
			prop === 'devDependencies'
		) {
			delete pkg[prop];
		}
	}

	pkg.electronVersion = electronVersion;
	// Match ow-electron-builder's JSON.stringify(data, null, 2) exactly (no trailing newline).
	fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf8');
	console.log(`  Finalized package.json with electronVersion=${electronVersion}`);
}

function prune(appDir) {
	const resolvedAppDir = appDir || path.join(process.cwd(), 'dist', 'apps', 'electron-app');
	const nodeModulesPath = path.join(resolvedAppDir, 'node_modules');

	console.log('\n🔧 Preparing electron-app (before Overwolf signing)...');
	console.log(`  App dir: ${resolvedAppDir}`);
	finalizePackageJsonForOwSigning(resolvedAppDir);

	if (!fs.existsSync(nodeModulesPath)) {
		console.log(`  No node_modules at ${nodeModulesPath}, skipping.`);
		return;
	}

	const sizeBefore = getDirSize(nodeModulesPath);
	console.log(`  Size before: ${(sizeBefore / 1024 / 1024).toFixed(2)} MB`);

	const edgeJsPath = path.join(nodeModulesPath, 'electron-edge-js');
	if (fs.existsSync(edgeJsPath)) {
		console.log('\n  Optimizing electron-edge-js...');

		const nativePath = path.join(edgeJsPath, 'lib', 'native');
		removeDir(path.join(nativePath, 'darwin'));
		removeDir(path.join(nativePath, 'linux'));

		const majorVersion = resolveElectronMajorVersion() ?? '39';
		console.log(`  Keeping only Electron v${majorVersion} binaries`);

		const win32x64Path = path.join(nativePath, 'win32', 'x64');
		if (fs.existsSync(win32x64Path)) {
			for (const item of fs.readdirSync(win32x64Path)) {
				const itemPath = path.join(win32x64Path, item);
				if (fs.statSync(itemPath).isDirectory() && /^\d+$/.test(item) && item !== majorVersion) {
					removeDir(itemPath);
				}
			}
		}

		removeDir(path.join(nativePath, 'win32', 'ia32'));
		removeDir(path.join(nativePath, 'win32', 'arm64'));
		removeDir(path.join(edgeJsPath, 'src'));
		removeDir(path.join(edgeJsPath, 'test'));
		removeFiles(edgeJsPath, ['binding.gyp', '.npmignore', 'CHANGELOG.md', 'README.md', /\.md$/, /\.gyp$/]);
	}

	const sqlitePath = path.join(nodeModulesPath, 'better-sqlite3');
	if (fs.existsSync(sqlitePath)) {
		console.log('\n  Optimizing better-sqlite3...');
		removeDir(path.join(sqlitePath, 'src'));
		removeDir(path.join(sqlitePath, 'docs'));
		removeDir(path.join(sqlitePath, 'benchmark'));
		removeFiles(sqlitePath, ['binding.gyp', '.npmignore', 'CHANGELOG.md', 'README.md', /\.md$/, /\.gyp$/]);
	}

	console.log('\n  General cleanup...');
	removeFiles(nodeModulesPath, [/\.ts$/, /\.d\.ts\.map$/, /\.tsbuildinfo$/]);

	const sizeAfter = getDirSize(nodeModulesPath);
	console.log(`\n  Size after: ${(sizeAfter / 1024 / 1024).toFixed(2)} MB`);
	console.log(`  💾 Saved: ${((sizeBefore - sizeAfter) / 1024 / 1024).toFixed(2)} MB`);
	console.log('✅ Pre-sign prune complete!\n');
}

/** electron-builder afterExtract hook */
exports.default = async function (context) {
	const appDir = context.packager?.info?.appDir || path.join(process.cwd(), 'dist', 'apps', 'electron-app');
	prune(appDir);
};

if (require.main === module) {
	prune();
}
