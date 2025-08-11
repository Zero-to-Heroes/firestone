/**
 * electron-builder afterPack hook
 * Removes unnecessary platform-specific files to reduce bundle size
 */
const fs = require('fs');
const path = require('path');

/**
 * Remove a directory recursively
 */
function removeDir(dirPath) {
	if (fs.existsSync(dirPath)) {
		fs.rmSync(dirPath, { recursive: true, force: true });
		console.log(`  Removed: ${dirPath}`);
	}
}

/**
 * Remove files matching a pattern in a directory
 */
function removeFiles(dirPath, patterns) {
	if (!fs.existsSync(dirPath)) return;
	
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

/**
 * Get directory size in MB
 */
function getDirSize(dirPath) {
	let size = 0;
	if (!fs.existsSync(dirPath)) return 0;
	
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

/**
 * afterPack hook - called after the app is packed but before installer is created
 */
exports.default = async function(context) {
	const appOutDir = context.appOutDir;
	const platform = context.electronPlatformName;
	
	console.log(`\n🔧 Running afterPack optimizations for ${platform}...`);
	
	const nodeModulesPath = path.join(appOutDir, 'resources', 'app.asar.unpacked', 'node_modules');
	
	if (!fs.existsSync(nodeModulesPath)) {
		console.log('  No unpacked node_modules found, skipping...');
		return;
	}
	
	const sizeBefore = getDirSize(nodeModulesPath);
	console.log(`  Size before: ${(sizeBefore / 1024 / 1024).toFixed(2)} MB`);
	
	// ===== electron-edge-js optimizations =====
	const edgeJsPath = path.join(nodeModulesPath, 'electron-edge-js');
	if (fs.existsSync(edgeJsPath)) {
		console.log('\n  Optimizing electron-edge-js...');
		
		const nativePath = path.join(edgeJsPath, 'lib', 'native');
		
		if (platform === 'win32') {
			// Remove non-Windows platforms
			removeDir(path.join(nativePath, 'darwin'));
			removeDir(path.join(nativePath, 'linux'));
			
			// Keep only the current Electron major version binaries
			// Try multiple sources to get the Electron version
			let electronVersion = null;
			try {
				electronVersion = context.packager?.appInfo?.electronVersion 
					|| context.electronPlatformName && require('electron/package.json').version
					|| process.versions.electron;
			} catch (e) {
				// Fallback: read from the project's package.json electron dependency
				try {
					const pkgPath = path.join(process.cwd(), 'node_modules', 'electron', 'package.json');
					if (fs.existsSync(pkgPath)) {
						electronVersion = require(pkgPath).version;
					}
				} catch (e2) {}
			}
			
			// Default to 34 if we can't detect (ow-electron 34.x is being used)
			const majorVersion = electronVersion ? electronVersion.split('.')[0] : '34';
			console.log(`  Keeping only Electron v${majorVersion} binaries`);
			
			// Clean up win32/x64 versions
			const win32x64Path = path.join(nativePath, 'win32', 'x64');
			if (fs.existsSync(win32x64Path)) {
				const items = fs.readdirSync(win32x64Path);
				for (const item of items) {
					const itemPath = path.join(win32x64Path, item);
					// Only remove version directories (numeric names like "32", "33", etc.)
					if (fs.statSync(itemPath).isDirectory() && /^\d+$/.test(item) && item !== majorVersion) {
						removeDir(itemPath);
					}
				}
			}
			
			// Clean up win32/ia32 if exists (we only need x64)
			removeDir(path.join(nativePath, 'win32', 'ia32'));
			removeDir(path.join(nativePath, 'win32', 'arm64'));
		}
		
		// Remove build artifacts and unnecessary files
		// Keep build folder - it contains edge_nativeclr.node which is required at runtime
		removeDir(path.join(edgeJsPath, 'src'));
		removeDir(path.join(edgeJsPath, 'test'));
		// Keep tools folder - it contains checkMono.js which is required at runtime
		// Only remove non-essential files from tools if needed
		removeFiles(edgeJsPath, [
			'binding.gyp',
			'.npmignore',
			'CHANGELOG.md',
			'README.md',
			/\.md$/,
			/\.gyp$/,
		]);
	}
	
	// ===== better-sqlite3 optimizations =====
	const sqlitePath = path.join(nodeModulesPath, 'better-sqlite3');
	if (fs.existsSync(sqlitePath)) {
		console.log('\n  Optimizing better-sqlite3...');
		
		// IMPORTANT: Keep build/Release/*.node - these are the native binaries!
		// Only remove source files and docs, NOT the build folder
		removeDir(path.join(sqlitePath, 'src'));
		removeDir(path.join(sqlitePath, 'docs'));
		removeDir(path.join(sqlitePath, 'benchmark'));
		removeFiles(sqlitePath, [
			'binding.gyp',
			'.npmignore',
			'CHANGELOG.md',
			'README.md',
			/\.md$/,
			/\.gyp$/,
		]);
	}
	
	// ===== General cleanup =====
	console.log('\n  General cleanup...');
	
	// Remove TypeScript source files and declaration maps
	removeFiles(nodeModulesPath, [
		/\.ts$/,
		/\.d\.ts\.map$/,
		/\.tsbuildinfo$/,
	]);
	
	const sizeAfter = getDirSize(nodeModulesPath);
	const saved = sizeBefore - sizeAfter;
	
	console.log(`\n  Size after: ${(sizeAfter / 1024 / 1024).toFixed(2)} MB`);
	console.log(`  💾 Saved: ${(saved / 1024 / 1024).toFixed(2)} MB`);
	console.log('✅ afterPack optimizations complete!\n');
};
