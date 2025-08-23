// Simple Edge.js wrapper for MindVision .NET integration
const edge = require('edge-js');
const path = require('path');

class MindVisionEdgeSimple {
	constructor() {
		// Create the edge function that will execute our C# code
		this.edgeFunc = edge.func({
			source: path.join(__dirname, 'MindVisionBridge-Simple.cs'),
			references: ['System.dll', 'System.Core.dll', 'System.Reflection.dll'],
		});

		this.initialized = false;
	}

	async initialize() {
		try {
			console.log('[MindVisionEdgeSimple] Initializing plugin...');
			const result = await this.callMethod('initialize');

			if (result.success) {
				this.initialized = true;
				console.log('[MindVisionEdgeSimple] Plugin initialized successfully:', result.message);
				console.log('[MindVisionEdgeSimple] Plugin type:', result.pluginType);
				return true;
			} else {
				console.error('[MindVisionEdgeSimple] Failed to initialize:', result.error);
				if (result.availableTypes) {
					console.log('[MindVisionEdgeSimple] Available types:', result.availableTypes);
				}
				return false;
			}
		} catch (error) {
			console.error('[MindVisionEdgeSimple] Initialize error:', error);
			return false;
		}
	}

	async getCurrentSceneSync() {
		if (!this.initialized) {
			throw new Error('Plugin not initialized. Call initialize() first.');
		}

		try {
			const result = await this.callMethod('getCurrentSceneSync');
			return result;
		} catch (error) {
			console.error('[MindVisionEdgeSimple] getCurrentSceneSync error:', error);
			throw error;
		}
	}

	async testCallback() {
		if (!this.initialized) {
			throw new Error('Plugin not initialized. Call initialize() first.');
		}

		try {
			const result = await this.callMethod('testCallback');
			return result;
		} catch (error) {
			console.error('[MindVisionEdgeSimple] testCallback error:', error);
			throw error;
		}
	}

	async isInitialized() {
		try {
			const result = await this.callMethod('isInitialized');
			return result;
		} catch (error) {
			console.error('[MindVisionEdgeSimple] isInitialized error:', error);
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
			console.error('[MindVisionEdgeSimple] listMethods error:', error);
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

module.exports = MindVisionEdgeSimple;
