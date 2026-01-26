import { contextBridge, ipcRenderer } from 'electron';

// Store original console methods before overriding
const originalConsoleLog = console.log.bind(console);
const originalConsoleWarn = console.warn.bind(console);
const originalConsoleError = console.error.bind(console);
const originalConsoleDebug = console.debug.bind(console);

// Batch logs to reduce IPC overhead
const logQueue: Array<{ level: string; args: any[] }> = [];
let logFlushTimer: number | null = null;
const LOG_BATCH_SIZE = 5; // Send batch after 5 logs
const LOG_FLUSH_INTERVAL = 500; // Or send every 500ms

const flushLogs = () => {
	if (logQueue.length === 0) {
		return;
	}

	const logsToSend = logQueue.splice(0); // Clear queue
	try {
		// Send all logs in one IPC call
		ipcRenderer.send('renderer-log-batch', logsToSend);
	} catch (e) {
		// Ignore IPC errors (e.g., if main process is not ready)
	}

	if (logFlushTimer !== null) {
		clearTimeout(logFlushTimer);
		logFlushTimer = null;
	}
};

// Helper function to serialize error objects properly
const serializeError = (arg: any): string => {
	if (arg instanceof Error) {
		return `${arg.name}: ${arg.message}\n${arg.stack || ''}`;
	}
	if (typeof arg === 'object' && arg !== null) {
		try {
			return JSON.stringify(arg, Object.getOwnPropertyNames(arg), 2);
		} catch (e) {
			return String(arg);
		}
	}
	return String(arg);
};

// Helper function to send log to main process (batched)
const sendLogToMain = (level: string, ...args: any[]) => {
	// Serialize arguments properly, especially error objects
	const serializedArgs = args.map(arg => serializeError(arg));
	logQueue.push({ level, args: serializedArgs });

	// Flush if batch size reached
	if (logQueue.length >= LOG_BATCH_SIZE) {
		flushLogs();
	} else if (logFlushTimer === null) {
		// Schedule flush after interval
		logFlushTimer = setTimeout(flushLogs, LOG_FLUSH_INTERVAL) as unknown as number;
	}
};

// Override console methods to also send logs to main process
console.log = (...args: any[]) => {
	originalConsoleLog(...args);
	sendLogToMain('info', ...args);
};

console.warn = (...args: any[]) => {
	originalConsoleWarn(...args);
	sendLogToMain('warn', ...args);
};

console.error = (...args: any[]) => {
	originalConsoleError(...args);
	sendLogToMain('error', ...args);
};

console.debug = (...args: any[]) => {
	originalConsoleDebug(...args);
	// sendLogToMain('debug', ...args);
};

// Set up global error handlers to catch unhandled errors
window.addEventListener('error', (event) => {
	console.error('Unhandled error:', event.error || event.message, event.filename, event.lineno);
});

window.addEventListener('unhandledrejection', (event) => {
	console.error('Unhandled promise rejection:', event.reason);
});

console.log('[Preload] Loading preload script...');
console.log('[Preload] Context isolation enabled:', process.contextIsolated);

const electronAPI = {
	getAppVersion: () => ipcRenderer.invoke('get-app-version'),
	getRunningGameInfo: () => {
		// console.log('[Preload] getRunningGameInfo called');
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
