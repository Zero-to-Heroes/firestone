#!/usr/bin/env node

/**
 * Build script for MindVision Edge.js module with aggressive cache clearing
 *
 * This script handles the compilation and setup of the Edge.js bridge
 * for the MindVision plugin integration, with robust cache management
 * to prevent stale code issues that have been occurring frequently.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

console.log('🔨 Building MindVision Edge.js module with enhanced cache management...\n');

// Check if we're in the right directory
const rootDir = path.resolve(__dirname, '../..');
const packageJsonPath = path.join(rootDir, 'package.json');

if (!fs.existsSync(packageJsonPath)) {
	console.error('❌ Error: Could not find package.json. Please run this script from the project root.');
	process.exit(1);
}

/**
 * Recursively remove directory with error handling
 */
function removeDirectory(dir) {
	try {
		if (fs.existsSync(dir)) {
			fs.rmSync(dir, { recursive: true, force: true });
			return true;
		}
	} catch (error) {
		console.log(`⚠️  Could not remove ${dir}: ${error.message}`);
	}
	return false;
}

/**
 * Clear all caches that could cause stale code issues
 */
function clearAllCaches() {
	console.log('🧹 Step 0: Aggressively clearing all caches to prevent stale code...');

	// Clear electron-edge-js build cache
	const edgeJsBuildDir = path.join(rootDir, 'node_modules/electron-edge-js/build');
	if (removeDirectory(edgeJsBuildDir)) {
		console.log('✅ Cleared electron-edge-js build cache');
	}

	// Clear Nx cache
	const nxCacheDir = path.join(rootDir, 'node_modules/.cache/nx');
	if (removeDirectory(nxCacheDir)) {
		console.log('✅ Cleared Nx cache');
	}

	// Clear dist mind-vision-edge directory completely
	const distDir = path.join(rootDir, 'dist/apps/electron-app/mind-vision-edge');
	if (removeDirectory(distDir)) {
		console.log('✅ Cleared existing dist/mind-vision-edge');
	}

	// Clear any electron-edge-js temp files
	try {
		const tempDir = process.env.TEMP || process.env.TMP || '/tmp';
		if (fs.existsSync(tempDir)) {
			const tempFiles = fs.readdirSync(tempDir).filter(
				(file) =>
					file.includes('edge-js') ||
					file.includes('electron-edge') ||
					file.includes('clr-') ||
					file.match(/^[a-z0-9]{8,}\.0\.cs$/) || // C# temp compilation files
					file.match(/^[a-z0-9]{8,}\.0\.dll$/) || // Compiled DLL files
					file.match(/^[a-z0-9]{8,}\.0\.pdb$/) || // Debug files
					file.endsWith('.cs') || // Any C# files
					(file.endsWith('.dll') && file.includes('tmp')), // Temp DLLs
			);

			let clearedCount = 0;
			tempFiles.forEach((file) => {
				try {
					const fullPath = path.join(tempDir, file);
					const stats = fs.statSync(fullPath);
					if (stats.isDirectory()) {
						fs.rmSync(fullPath, { recursive: true, force: true });
					} else {
						fs.unlinkSync(fullPath);
					}
					clearedCount++;
				} catch (e) {
					// Ignore errors for temp file cleanup
				}
			});

			if (clearedCount > 0) {
				console.log(`✅ Cleared ${clearedCount} electron-edge-js temp files`);
			}
		}
	} catch (e) {
		console.log('⚠️  Could not clear some temp files (this is usually fine)');
	}

	// Clear any Node.js module cache for our files
	const moduleCache = require.cache;
	Object.keys(moduleCache).forEach((key) => {
		if (key.includes('mind-vision-edge')) {
			delete moduleCache[key];
		}
	});

	// Kill any running edge-js processes that might hold compiled code
	try {
		if (process.platform === 'win32') {
			execSync('taskkill /f /im "edge.exe" 2>nul || true', { stdio: 'ignore' });
			execSync('taskkill /f /im "csc.exe" 2>nul || true', { stdio: 'ignore' });
		}
	} catch (e) {
		// Ignore errors - processes might not be running
	}

	console.log('✅ All caches cleared and processes cleaned\n');
}

/**
 * Get file hash for verification
 */
function getFileHash(filePath) {
	try {
		const content = fs.readFileSync(filePath, 'utf8');
		return crypto.createHash('md5').update(content).digest('hex').substring(0, 8);
	} catch (e) {
		return 'error';
	}
}

try {
	// Step 0: Clear all caches
	clearAllCaches();

	// Step 1: Rebuild electron-edge-js native modules with force
	console.log('📦 Step 1: Rebuilding electron-edge-js for current Electron version...');
	execSync('npm run build:mindvision:rebuild', {
		cwd: rootDir,
		stdio: 'inherit',
	});
	console.log('✅ Native modules rebuilt successfully\n');

	// Step 2: Build electron app
	console.log('🏗️  Step 2: Building Electron app...');
	execSync('npm run build:mindvision:copy', {
		cwd: rootDir,
		stdio: 'inherit',
	});
	console.log('✅ Electron app built successfully\n');

	// Step 3: Force copy files with verification
	console.log('📁 Step 3: Force-copying MindVision files with verification...');

	const distPath = path.join(rootDir, 'dist/apps/electron-app/mind-vision-edge');
	const srcPath = path.join(rootDir, 'libs/mind-vision-edge');

	// Ensure dist directory exists
	if (!fs.existsSync(distPath)) {
		fs.mkdirSync(distPath, { recursive: true });
		console.log('✅ Created dist directory');
	}

	// Force copy critical files with timestamp and hash verification
	const criticalFiles = [
		{ src: 'index.js', required: true },
		{ src: 'MindVisionBridge.cs', required: true },
		{ src: 'README.md', required: false },
		{ src: 'Newtonsoft.Json.dll', required: false },
	];

	criticalFiles.forEach(({ src, required }) => {
		const srcFile = path.join(srcPath, src);
		const destFile = path.join(distPath, src);

		if (fs.existsSync(srcFile)) {
			// Always overwrite
			fs.copyFileSync(srcFile, destFile);
			const stats = fs.statSync(destFile);
			const hash = getFileHash(destFile);
			console.log(
				`✅ ${src} copied (${stats.size} bytes, hash: ${hash}, modified: ${stats.mtime.toISOString()})`,
			);
		} else if (required) {
			console.log(`❌ ${src} not found in source - THIS IS CRITICAL!`);
		} else {
			console.log(`⚠️  ${src} not found in source (optional)`);
		}
	});

	console.log('✅ Force-copy completed\n');

	// Step 4: Verify build with enhanced checks
	console.log('🔍 Step 4: Verifying build with enhanced checks...');

	const requiredFiles = ['index.js', 'MindVisionBridge.cs'];
	const optionalFiles = ['Newtonsoft.Json.dll', 'README.md'];

	let allCriticalFilesPresent = true;

	console.log('Critical files:');
	requiredFiles.forEach((file) => {
		const filePath = path.join(distPath, file);
		if (fs.existsSync(filePath)) {
			const stats = fs.statSync(filePath);
			const hash = getFileHash(filePath);
			console.log(`  ✅ ${file} (${stats.size} bytes, hash: ${hash})`);
		} else {
			console.log(`  ❌ ${file} - MISSING!`);
			allCriticalFilesPresent = false;
		}
	});

	console.log('Optional files:');
	optionalFiles.forEach((file) => {
		const filePath = path.join(distPath, file);
		if (fs.existsSync(filePath)) {
			const stats = fs.statSync(filePath);
			console.log(`  ✅ ${file} (${stats.size} bytes)`);
		} else {
			console.log(`  ⚠️  ${file} - Missing (optional)`);
		}
	});

	// Step 5: Create build metadata for debugging
	console.log('\n🏷️  Step 5: Creating build metadata...');
	const buildMetadata = {
		timestamp: new Date().toISOString(),
		nodeVersion: process.version,
		platform: process.platform,
		arch: process.arch,
		files: {},
	};

	requiredFiles.concat(optionalFiles).forEach((file) => {
		const filePath = path.join(distPath, file);
		if (fs.existsSync(filePath)) {
			const stats = fs.statSync(filePath);
			buildMetadata.files[file] = {
				size: stats.size,
				modified: stats.mtime.toISOString(),
				hash: getFileHash(filePath),
			};
		}
	});

	const metadataFile = path.join(distPath, '.build-metadata.json');
	fs.writeFileSync(metadataFile, JSON.stringify(buildMetadata, null, 2));
	console.log(`✅ Build metadata created: ${metadataFile}`);

	if (allCriticalFilesPresent) {
		console.log('\n🎉 MindVision Edge.js module built successfully with enhanced cache management!');
		console.log('\n📋 Next steps:');
		console.log('  1. Run: npm run start:ow-electron');
		console.log('  2. The MindVisionElectronService should now have access to all methods');
		console.log('\n💡 Cache management features:');
		console.log('  ✅ electron-edge-js build cache cleared');
		console.log('  ✅ Nx cache cleared');
		console.log('  ✅ Temp C# compilation files cleared');
		console.log('  ✅ Force file overwriting enabled');
		console.log('  ✅ File verification with hashes');
		console.log('  ✅ Build metadata tracking');
		console.log('\n🔧 If you still encounter cache issues:');
		console.log('  - Try: npm run build:mindvision:clean');
		console.log('  - Restart your terminal/IDE');
		console.log('  - Check build metadata in dist/.build-metadata.json');
	} else {
		console.log('\n❌ Build completed but critical files are missing. Check the output above.');
		process.exit(1);
	}
} catch (error) {
	console.error('❌ Build failed:', error.message);
	console.log('\n💡 Troubleshooting:');
	console.log('  - Ensure you have the latest version of electron-rebuild installed');
	console.log('  - Try running: npm run build:mindvision:clean');
	console.log('  - Check that all dependencies are installed: npm install');
	console.log('  - Try restarting your terminal/IDE');
	console.log('  - If still failing, delete node_modules/electron-edge-js and run npm install');
	process.exit(1);
}
