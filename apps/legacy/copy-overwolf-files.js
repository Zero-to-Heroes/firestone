const fs = require('fs');
const path = require('path');

const overwolfDir = path.resolve('./overwolf');
const pluginsDir = path.resolve('./overwolf-plugins');
const outputDir = path.resolve('./dist/apps/legacy');
const pluginsOutputDir = path.resolve('./dist/apps/legacy/plugins');

function ensureDirectoryExists(dirPath) {
	if (!fs.existsSync(dirPath)) {
		fs.mkdirSync(dirPath, { recursive: true });
	}
}

function copyDirectory(sourceDir, targetDir, dirName) {
	if (!fs.existsSync(sourceDir)) {
		console.log(`[Pre-build] ${dirName} directory not found`);
		return;
	}

	console.log(`[Pre-build] Copying ${dirName}...`);
	ensureDirectoryExists(targetDir);

	const files = fs.readdirSync(sourceDir);
	let successCount = 0;
	let errorCount = 0;

	files.forEach((file) => {
		const sourcePath = path.join(sourceDir, file);
		const targetPath = path.join(targetDir, file);

		if (fs.lstatSync(sourcePath).isFile()) {
			try {
				fs.copyFileSync(sourcePath, targetPath);
				successCount++;
				console.log(`[Pre-build] ✓ Copied ${file}`);
			} catch (error) {
				errorCount++;
				if (error.code === 'EBUSY' || error.code === 'EPERM') {
					console.warn(
						`[Pre-build] ⚠️  Warning: ${file} is locked (likely in use by running app) - skipping`,
					);
				} else {
					console.warn(`[Pre-build] ⚠️  Warning: Could not copy ${file}:`, error.message);
				}
			}
		}
	});

	console.log(`[Pre-build] ${dirName} copy completed: ${successCount} files copied, ${errorCount} files skipped`);
}

function copyOverwolfFiles() {
	// Copy overwolf files to root
	copyDirectory(overwolfDir, outputDir, 'overwolf');

	// Copy overwolf-plugins to Files/plugins
	copyDirectory(pluginsDir, pluginsOutputDir, 'overwolf-plugins');

	console.log('[Pre-build] All overwolf files processed successfully');
}

// Execute the copy
copyOverwolfFiles();
