export const isElectronContext = () => {
	return (
		typeof window !== 'undefined' &&
		((window as any).electronAPI !== undefined ||
			(typeof process !== 'undefined' && process.versions?.electron !== undefined))
	);
};

// In Electron, detect main process vs renderer process
// Main process: has process.type === undefined or 'browser'
// Renderer process: has process.type === 'renderer' and window object exists
export const isMainProcess = () => {
	return (
		typeof window === 'undefined' && typeof process !== 'undefined' && (!process.type || process.type === 'browser')
	);
};
