import App from '../app';

export class MindVisionElectronService {
	private mindVision: any;
	private initialized = false;
	private currentScene: string | null = null;
	private initializationRetries = 0;
	private maxRetries = 3;

	constructor() {
		// Delay initialization to allow overlay to be ready first
		setTimeout(() => this.initializeMindVision(), 2000);
	}

	private async initializeMindVision() {
		try {
			console.log('[MindVisionElectron] Attempting to initialize MindVision...');

			// Try to load the Edge.js wrapper
			const path = require('path');
			const mindVisionPath = path.join(__dirname, 'mind-vision-edge');
			console.log('[MindVisionElectron] Looking for module at:', mindVisionPath);

			// Use eval to bypass webpack's module resolution
			const MindVisionEdge = eval('require')(mindVisionPath);
			this.mindVision = new MindVisionEdge();

			console.log('[MindVisionElectron] Initializing plugin...');
			const success = await this.mindVision.initialize();

			if (success) {
				this.initialized = true;
				console.log('[MindVisionElectron] Plugin initialized successfully!');
				this.updateOverlayStatus('Connected');
				this.startListeningForUpdates();
			} else {
				console.error('[MindVisionElectron] Failed to initialize plugin');
				this.updateOverlayStatus('Failed to initialize');
			}
		} catch (error) {
			console.error('[MindVisionElectron] Error initializing MindVision:', error);
			this.initializationRetries++;

			if (this.initializationRetries < this.maxRetries) {
				console.log(
					`[MindVisionElectron] Retrying initialization in 5 seconds... (${this.initializationRetries}/${this.maxRetries})`,
				);
				setTimeout(() => this.initializeMindVision(), 5000);
			} else {
				console.error('[MindVisionElectron] Max retries reached. MindVision will not be available.');
				this.updateOverlayStatus('Failed to load MindVision plugin');
			}
		}
	}

	private async startListeningForUpdates() {
		try {
			console.log('[MindVisionElectron] Starting to listen for memory updates...');

			// Start listening for memory updates with real-time callback
			await this.mindVision.startListeningWithCallback((updateData: any) => {
				if (updateData && updateData.memoryUpdate) {
					// Display the JSON data in the overlay immediately
					this.updateOverlayWithJSON(
						updateData.memoryUpdate,
						updateData.timestamp || new Date().toLocaleTimeString(),
					);
				}
			});

			console.log(
				'[MindVisionElectron] Successfully started listening for memory updates with real-time callback',
			);
			this.updateOverlayStatus('Listening for real-time memory updates...');
		} catch (error) {
			console.error('[MindVisionElectron] Error starting memory update listener:', error);
			this.updateOverlayStatus('Failed to start listener');
		}
	}

	public getCurrentScene(): string | null {
		return this.currentScene;
	}

	public isInitialized(): boolean {
		return this.initialized;
	}

	public destroy() {
		this.initialized = false;
		this.currentScene = null;
	}

	private updateOverlayScene(scene: string | null) {
		if (App.overlay) {
			console.log(`[MindVisionElectron] Updating overlay with scene: ${scene}`);
			App.overlay.updateSceneDisplay(scene, 'Connected');
		} else {
			console.log('[MindVisionElectron] Warning: App.overlay not available for scene update');
		}
	}

	private updateOverlayStatus(status: string) {
		if (App.overlay) {
			App.overlay.updateSceneDisplay(this.currentScene, status);
		}
	}

	private updateOverlayWithJSON(jsonData: string, timestamp?: string) {
		if (App.overlay) {
			// Display the JSON data in the overlay instead of just the scene
			App.overlay.updateSceneDisplay(jsonData, `Last update: ${timestamp || new Date().toLocaleTimeString()}`);
		}
	}
}
