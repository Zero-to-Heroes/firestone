import { Injectable } from '@angular/core';
import { IGameEventsPlugin } from '@firestone/game-state';

@Injectable()
export class GameEventsElectronService extends IGameEventsPlugin {
	private gameEventsPlugin: any;

	private initialized = false;
	private initializing = false;

	public globalEventListener: (first: string, second: string) => Promise<void> = async () => {};

	public override async init(onGameEventReceived: (gameEvent) => void) {
		if (this.initialized || this.initializing) {
			return;
		}

		console.log('[GameEventsElectron] Attempting to initialize GameEvents');
		// Try to load the Edge.js wrapper
		const path = require('path');
		const edgePath = path.join(__dirname, 'electron-edge-libs');
		console.log('[GameEventsElectron] Looking for module at:', edgePath);

		// Clear module cache to ensure we get the latest version
		const indexPath = path.join(edgePath, 'game-events-edge.js');
		if (eval('require').cache[indexPath]) {
			console.log('[GameEventsElectron] Clearing cached module...');
			delete eval('require').cache[indexPath];
		}

		// Use eval to bypass webpack's module resolution
		const GameEventsEdge = eval('require')(indexPath);
		this.gameEventsPlugin = new GameEventsEdge();

		this.gameEventsPlugin.setGameEventCallback((updateData: any) => {
			if (updateData && updateData.memoryUpdate) {
				console.debug('[GameEventsElectron] Game event received:', updateData.memoryUpdate);

				// Handle both string and object formats
				let parsedUpdate;
				if (typeof updateData.memoryUpdate === 'string') {
					try {
						parsedUpdate = JSON.parse(updateData.memoryUpdate);
					} catch (e) {
						console.warn('[GameEventsElectron] Failed to parse memory update:', e);
						return;
					}
				} else {
					parsedUpdate = updateData.memoryUpdate;
				}

				onGameEventReceived(parsedUpdate);
			}
		});
		this.gameEventsPlugin.setLogger((log1, log2) => {
			console.log('[GameEventsElectron]', log1, log2);
		});

		console.log('[GameEventsElectron] Initializing plugin...');
		const success = await this.gameEventsPlugin.initialize();

		if (success) {
			this.initialized = true;
			console.log('[GameEventsElectron] Plugin initialized successfully!');
			// this.startListeningForUpdates();
		} else {
			console.error('[GameEventsElectron] Failed to initialize plugin');
		}
	}

	public override async isReady(): Promise<boolean> {
		await this.waitForInit();
		return true;
	}

	public override async askForGameStateUpdate() {
		const plugin = await this.get();
		plugin.askForGameStateUpdate();
	}

	public override async realtimeLogProcessing(lines: readonly string[], callback) {
		const plugin = await this.get();
		plugin.realtimeLogProcessing(lines, () => callback());
	}

	private async get() {
		await this.waitForInit();
		return this.gameEventsPlugin.get();
	}

	private waitForInit(): Promise<void> {
		return new Promise<void>((resolve) => {
			const dbWait = () => {
				if (this.initialized) {
					resolve();
				} else {
					setTimeout(() => dbWait(), 50);
				}
			};
			dbWait();
		});
	}
}
