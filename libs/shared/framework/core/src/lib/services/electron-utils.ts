export const isElectronContext = () => {
	// The most reliable way to detect Electron is checking for process.versions.electron
	// This works in both main process and renderer process
	const hasElectronVersion = typeof process !== 'undefined' && process.versions?.electron !== undefined;

	return hasElectronVersion;
};

// In Electron, detect main process vs renderer process
// Main process: has process.type === undefined or 'browser'
// Renderer process: has process.type === 'renderer' and window object exists
export const isMainProcess = () => {
	return (
		typeof window === 'undefined' && typeof process !== 'undefined' && (!process.type || process.type === 'browser')
	);
};
