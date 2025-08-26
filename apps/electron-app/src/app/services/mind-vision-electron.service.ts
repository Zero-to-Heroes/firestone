import App from '../app';

export class MindVisionElectronService {
	private mindVision: any;
	private initialized = false;
	private currentScene: string | null = null;
	private pollingInterval: NodeJS.Timeout | null = null;
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
				this.startPolling();
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

	private startPolling() {
		if (this.pollingInterval) {
			clearInterval(this.pollingInterval);
		}

		this.pollingInterval = setInterval(async () => {
			try {
				const scene = await this.mindVision.getCurrentScene();
				if (scene !== this.currentScene) {
					this.currentScene = scene;
					console.log('[MindVisionElectron] Scene changed to:', scene);

					// Update the overlay with the new scene
					this.updateOverlayScene(scene);
				}
			} catch (error) {
				console.error('[MindVisionElectron] Error getting current scene:', error);
				this.updateOverlayStatus('Error reading scene');
			}
		}, 1000); // Poll every second

		console.log('[MindVisionElectron] Started polling for scene changes');
	}

	public getCurrentScene(): string | null {
		return this.currentScene;
	}

	public isInitialized(): boolean {
		return this.initialized;
	}

	public stopPolling() {
		if (this.pollingInterval) {
			clearInterval(this.pollingInterval);
			this.pollingInterval = null;
			console.log('[MindVisionElectron] Stopped polling');
		}
	}

	public destroy() {
		this.stopPolling();
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
}
