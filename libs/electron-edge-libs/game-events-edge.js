const edge = require('electron-edge-js');
const path = require('path');

class GameEventsEdge {
	constructor(pluginsDirectory = null) {
		// During build, all DLLs are copied to the same directory as index.js
		// So we can reference them directly from __dirname
		const dllPath = path.join(__dirname, 'HearthstoneReplays.dll');
		const newtonsoftPath = path.join(__dirname, 'Newtonsoft.Json.dll');

		console.log('[GameEventsEdge] DLL Path:', dllPath);
		console.log('[GameEventsEdge] Newtonsoft Path:', newtonsoftPath);

		// Store paths for edge function creation
		this.dllPath = dllPath;
		this.newtonsoftPath = newtonsoftPath;
		this.initialized = false;
		this.gameEventCallback = null;
		this.edgeFunctionCache = new Map();
	}

	// Set the memory update callback before initialization
	setGameEventCallback(callback) {
		this.gameEventCallback = callback;
	}
	setLogger(logger) {
		this.logger = logger;
	}

	// Get or create cached edge function for a specific method
	getEdgeFunction(methodName) {
		if (this.edgeFunctionCache.has(methodName)) {
			return this.edgeFunctionCache.get(methodName);
		}

		const edgeFunc = edge.func({
			assemblyFile: this.dllPath,
			typeName: 'HearthstoneReplays.StaticReplayConverterWrapper',
			methodName: methodName,
			references: ['System.dll', 'System.Core.dll', this.newtonsoftPath],
		});

		this.edgeFunctionCache.set(methodName, edgeFunc);
		return edgeFunc;
	}

	async initialize() {
		try {
			console.log('[GameEventsEdge] Initializing plugin...');

			if (this.logger) {
				console.log('[GameEventsEdge] Setting up logger...');
				await this.callPluginMethod('setLogger', (log1, log2) => {
					if (this.logger) {
						this.logger(log1, log2);
					}
				});
				console.log('[GameEventsEdge] Logger setup complete');
			}

			// Set up memory update callback if we have one
			if (this.gameEventCallback) {
				console.log('[GameEventsEdge] Setting up memory update callback...');
				await this.callPluginMethod('setGameEventCallback', (gameEvent) => {
					if (this.gameEventCallback) {
						this.gameEventCallback({ gameEvent });
					}
				});
				console.log('[GameEventsEdge] Memory callback setup complete');
			}

			this.initialized = true;
			console.log('[GameEventsEdge] Plugin initialized successfully');
			return true;
		} catch (error) {
			console.error('[GameEventsEdge] Initialize error:', error);
			this.initialized = false;
			return false;
		}
	}

	async initRealtimeLogConversion() {
		return this.callPluginMethod('initRealtimeLogConversion');
	}

	async tearDown() {
		// Clean up our state
		this.initialized = false;
		this.gameEventCallback = null;
		this.edgeFunctionCache.clear();

		return result;
	}

	// Helper method to call plugin methods with proper error handling
	async callPluginMethod(methodName, params = {}) {
		console.debug('[GameEventsEdge] [debug] Calling plugin method:', methodName);
		if (!this.initialized && methodName !== 'setMemoryUpdateCallback' && methodName !== 'setLogger') {
			throw new Error('Plugin not initialized');
		}

		return new Promise((resolve, reject) => {
			try {
				// Get cached edge function for this method
				console.debug('[GameEventsEdge] [debug] Getting edge function for:', methodName);
				const edgeFunc = this.getEdgeFunction(methodName);
				console.debug('[GameEventsEdge] [debug]', methodName, 'Got edge function:');

				// All methods now follow the same pattern: async Task<object> MethodName(dynamic input)
				edgeFunc(params, (error, result) => {
					console.debug('[GameEventsEdge] [debug]', methodName, 'Edge function result:', result);
					if (error) {
						reject(error);
					} else {
						this.handleMethodResult(result, methodName, resolve, reject);
					}
				});
			} catch (error) {
				reject(error);
			}
		});
	}

	// Helper method to handle method results consistently
	handleMethodResult(result, methodName, resolve, reject) {
		// Handle special cases
		if (result === 'exception') {
			reject(new Error(`Exception occurred in ${methodName}`));
		} else if (result === null || result === undefined) {
			resolve(null);
		} else {
			// Try to parse JSON if result is a string that looks like JSON
			if (typeof result === 'string' && (result.startsWith('{') || result.startsWith('['))) {
				try {
					resolve(JSON.parse(result));
				} catch (e) {
					resolve(result);
				}
			} else {
				resolve(result);
			}
		}
	}
}

module.exports = GameEventsEdge;
