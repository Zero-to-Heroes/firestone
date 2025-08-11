import { contextBridge, ipcRenderer } from 'electron';

console.log('[Preload] Loading preload script...');
console.log('[Preload] Context isolation enabled:', process.contextIsolated);

const electronAPI = {
	getAppVersion: () => ipcRenderer.invoke('get-app-version'),
	getRunningGameInfo: () => {
		console.log('[Preload] getRunningGameInfo called');
		return ipcRenderer.invoke('get-running-game-info');
	},
	platform: process.platform,
};

const electron = {
	getAppVersion: () => ipcRenderer.invoke('get-app-version'),
	platform: process.platform,
};

// Use contextBridge if context isolation is enabled, otherwise expose directly to window
if (process.contextIsolated) {
	console.log('[Preload] Using contextBridge (context isolation enabled)');
	contextBridge.exposeInMainWorld('electronAPI', electronAPI);
	contextBridge.exposeInMainWorld('electron', electron);
} else {
	console.log('[Preload] Using direct window assignment (context isolation disabled)');
	// @ts-ignore - We're directly assigning to window when context isolation is disabled
	window.electronAPI = electronAPI;
	// @ts-ignore
	window.electron = electron;
}

console.log('[Preload] ElectronAPI exposed to renderer process');
