// Edge.js wrapper for MindVision .NET integration
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
				console.log('[MindVisionEdge] Plugin type:', result.pluginType);
				return true;
			} else {
				console.error('[MindVisionEdge] Failed to initialize:', result.error);
				if (result.availableTypes) {
					console.log('[MindVisionEdge] Available types:', result.availableTypes);
				}
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
				if (result.availableMethods) {
					console.log('[MindVisionEdge] Available methods:', result.availableMethods);
				}
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
				throw new Error(result.error);
			}
		} catch (error) {
			console.error('[MindVisionEdge] isBootstrapped error:', error);
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

	async listMethods() {
		if (!this.initialized) {
			throw new Error('Plugin not initialized. Call initialize() first.');
		}

		try {
			const result = await this.callMethod('listMethods');

			if (result.success) {
				return result.methods;
			} else {
				throw new Error(result.error);
			}
		} catch (error) {
			console.error('[MindVisionEdge] listMethods error:', error);
			throw error;
		}
	}

	// Private method to call the C# bridge
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
