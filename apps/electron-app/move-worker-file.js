const fs = require('fs');
const path = require('path');

// Try nested location first (where TypeScript outputs it)
const srcNested = path.join(__dirname, '..', '..', 'dist', 'apps', 'electron-app', 'app', 'services', 'src', 'app', 'services', 'bgs-battle-sim-worker.thread.js');
// Also check if it's already at app/services (from previous build)
const srcServices = path.join(__dirname, '..', '..', 'dist', 'apps', 'electron-app', 'app', 'services', 'bgs-battle-sim-worker.thread.js');
const dst = path.join(__dirname, '..', '..', 'dist', 'apps', 'electron-app', 'bgs-battle-sim-worker.thread.js');

let src = null;
if (fs.existsSync(srcNested)) {
	src = srcNested;
} else if (fs.existsSync(srcServices)) {
	src = srcServices;
}

if (src) {
	fs.mkdirSync(path.dirname(dst), { recursive: true });
	fs.renameSync(src, dst);
	console.log('Moved worker file to:', dst);
}

// Handle source maps
const srcMapNested = path.join(__dirname, '..', '..', 'dist', 'apps', 'electron-app', 'app', 'services', 'src', 'app', 'services', 'bgs-battle-sim-worker.thread.js.map');
const srcMapServices = path.join(__dirname, '..', '..', 'dist', 'apps', 'electron-app', 'app', 'services', 'bgs-battle-sim-worker.thread.js.map');
const dstMap = path.join(__dirname, '..', '..', 'dist', 'apps', 'electron-app', 'bgs-battle-sim-worker.thread.js.map');

let srcMap = null;
if (fs.existsSync(srcMapNested)) {
	srcMap = srcMapNested;
} else if (fs.existsSync(srcMapServices)) {
	srcMap = srcMapServices;
}

if (srcMap) {
	fs.renameSync(srcMap, dstMap);
	console.log('Moved worker source map to:', dstMap);
}

// Clean up nested directories
const nestedDir = path.join(__dirname, '..', '..', 'dist', 'apps', 'electron-app', 'app', 'services', 'src');
if (fs.existsSync(nestedDir)) {
	fs.rmSync(nestedDir, { recursive: true, force: true });
	console.log('Cleaned up nested directory');
}

