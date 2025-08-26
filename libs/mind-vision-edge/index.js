const edge = require('edge-js');
const path = require('path');

class MindVisionEdge {
	constructor() {
		// Create the edge function that will execute our C# code
		this.edgeFunc = edge.func({
			source: path.join(__dirname, 'MindVisionBridge.cs'),
			references: ['System.dll', 'System.Core.dll', 'System.Reflection.dll'],
		});

		this.initialized = false;
	}

	async initialize() {
		try {
			console.log('[MindVisionEdge] Initializing plugin...');
			const result = await this.callMethod('initialize');

			if (result.success) {
				this.initialized = true;
				console.log('[MindVisionEdge] Plugin initialized successfully:', result.message);
				return true;
			} else {
				console.error('[MindVisionEdge] Failed to initialize:', result.error);
				return false;
			}
		} catch (error) {
			console.error('[MindVisionEdge] Initialize error:', error);
			return false;
		}
	}

	async getCurrentScene() {
		if (!this.initialized) {
			throw new Error('Plugin not initialized. Call initialize() first.');
		}

		try {
			const result = await this.callMethod('getCurrentScene');

			if (result.success) {
				return result.scene;
			} else {
				console.error('[MindVisionEdge] getCurrentScene error:', result.error);
				throw new Error(result.error);
			}
		} catch (error) {
			console.error('[MindVisionEdge] getCurrentScene error:', error);
			throw error;
		}
	}

	async getMemoryChanges() {
		if (!this.initialized) {
			throw new Error('Plugin not initialized. Call initialize() first.');
		}

		try {
			const result = await this.callMethod('getMemoryChanges');

			if (result.success) {
				return result.changes;
			} else {
				console.error('[MindVisionEdge] getMemoryChanges error:', result.error);
				throw new Error(result.error);
			}
		} catch (error) {
			console.error('[MindVisionEdge] getMemoryChanges error:', error);
			throw error;
		}
	}

	async isBootstrapped() {
		if (!this.initialized) {
			throw new Error('Plugin not initialized. Call initialize() first.');
		}

		try {
			const result = await this.callMethod('isBootstrapped');

			if (result.success) {
				return result.bootstrapped;
			} else {
				console.error('[MindVisionEdge] isBootstrapped error:', result.error);
				throw new Error(result.error);
			}
		} catch (error) {
			console.error('[MindVisionEdge] isBootstrapped error:', error);
			throw error;
		}
	}

	async listenForUpdates() {
		if (!this.initialized) {
			throw new Error('Plugin not initialized. Call initialize() first.');
		}

		try {
			const result = await this.callMethod('listenForUpdates');

			if (result.success) {
				return result.message;
			} else {
				console.error('[MindVisionEdge] listenForUpdates error:', result.error);
				throw new Error(result.error);
			}
		} catch (error) {
			console.error('[MindVisionEdge] listenForUpdates error:', error);
			throw error;
		}
	}

	async isInitialized() {
		try {
			const result = await this.callMethod('isInitialized');
			return result;
		} catch (error) {
			console.error('[MindVisionEdge] isInitialized error:', error);
			return false;
		}
	}

	async callMethod(method, params = {}) {
		return new Promise((resolve, reject) => {
			this.edgeFunc({ method, ...params }, (error, result) => {
				if (error) {
					reject(error);
				} else {
					resolve(result);
				}
			});
		});
	}
}

module.exports = MindVisionEdge;
