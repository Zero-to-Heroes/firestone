import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { GameStatusService } from '@firestone/shared/common/service';
import { Subscription } from 'rxjs';

declare const window: any;

@Component({
	selector: 'electron-overlay',
	standalone: false,
	template: `
		<div class="electron-overlay-container">
			<!-- Game Status Test -->
			<div class="debug-info">
				<h2>🔥 Firestone Electron Overlay</h2>
				<p>Angular renderer process running</p>

				<div class="game-status-section">
					<h3>🎮 Game Status Service Test</h3>
					<p><strong>Service Ready:</strong> {{ gameStatusReady ? '✅' : '❌' }}</p>
					<p><strong>In Game:</strong> {{ inGame !== null ? (inGame ? '✅' : '❌') : '⏳' }}</p>
					<p><strong>Context:</strong> {{ isElectronContext ? 'Electron' : 'Unknown' }}</p>
				</div>

				<div *ngIf="gameInfo" class="game-info-section">
					<h3>🎮 Game Info Details</h3>
					<p><strong>Game:</strong> {{ gameInfo.displayName }}</p>
					<p><strong>Size:</strong> {{ gameInfo.width }}x{{ gameInfo.height }}</p>
					<p><strong>Focused:</strong> {{ gameInfo.isInFocus ? '✅' : '❌' }}</p>
					<p><strong>Running:</strong> {{ gameInfo.isRunning ? '✅' : '❌' }}</p>
					<p><strong>Execution Path:</strong> {{ gameInfo.executionPath || 'N/A' }}</p>
				</div>

				<div *ngIf="!gameInfo && tested" class="error-section">
					<h3>❌ No Game Info</h3>
					<p><strong>ElectronAPI:</strong> {{ hasElectronAPI ? '✅' : '❌' }}</p>
					<p><strong>getRunningGameInfo:</strong> {{ hasGameInfoMethod ? '✅' : '❌' }}</p>
				</div>
			</div>

			<!-- TODO: Add the constructed decktracker widget -->
			<constructed-decktracker-ooc-widget-wrapper></constructed-decktracker-ooc-widget-wrapper>
		</div>
	`,
	styles: [
		`
			.electron-overlay-container {
				width: 100vw;
				height: 100vh;
				background: transparent;
				position: fixed;
				top: 0;
				left: 0;
				pointer-events: none;
				z-index: 1000;
			}

			.debug-info {
				position: fixed;
				top: 20px;
				right: 20px;
				background: rgba(0, 0, 0, 0.8);
				color: white;
				padding: 15px;
				border-radius: 8px;
				border: 2px solid #ff6b35;
				font-family: 'Segoe UI', sans-serif;
				pointer-events: auto;
				z-index: 1001;
			}

			.debug-info h2 {
				margin: 0 0 10px 0;
				color: #ff6b35;
			}

			.debug-info p {
				margin: 5px 0;
				font-size: 14px;
			}

			.game-status-section {
				margin-top: 15px;
				padding-top: 15px;
				border-top: 1px solid #ff6b35;
			}

			.game-status-section h3 {
				margin: 0 0 10px 0;
				color: #4caf50;
			}

			.game-info-section {
				margin-top: 15px;
				padding-top: 15px;
				border-top: 1px solid #ff6b35;
			}

			.game-info-section h3 {
				margin: 0 0 10px 0;
				color: #4caf50;
			}

			.error-section {
				margin-top: 15px;
				padding-top: 15px;
				border-top: 1px solid #ff6b35;
			}

			.error-section h3 {
				margin: 0 0 10px 0;
				color: #f44336;
			}
		`,
	],
	changeDetection: ChangeDetectionStrategy.Default,
})
export class ElectronOverlayComponent implements OnInit, OnDestroy {
	gameInfo: any = null;
	tested = false;
	hasElectronAPI = false;
	hasGameInfoMethod = false;

	// GameStatusService properties
	gameStatusReady = false;
	inGame: boolean | null = null;
	isElectronContext = false;

	private subscriptions: Subscription[] = [];

	constructor(private readonly gameStatusService: GameStatusService) {
		console.log('[ElectronOverlay] Angular overlay component initialized');
	}

	async ngOnInit() {
		console.log('[ElectronOverlay] Initializing...');

		// Detect electron context
		this.isElectronContext =
			typeof window !== 'undefined' &&
			((window as any).electronAPI !== undefined ||
				(typeof process !== 'undefined' && process.versions?.electron !== undefined));

		console.log('[ElectronOverlay] Electron context:', this.isElectronContext);

		// Test legacy ElectronAPI for comparison
		await this.testLegacyElectronAPI();

		// Initialize GameStatusService
		await this.initGameStatusService();

		// Set up periodic updates
		this.setupPeriodicUpdates();
	}

	ngOnDestroy() {
		this.subscriptions.forEach((sub) => sub.unsubscribe());
	}

	private async testLegacyElectronAPI() {
		console.log('[ElectronOverlay] Testing legacy ElectronAPI...');
		console.log('[ElectronOverlay] window.electronAPI:', window.electronAPI);
		console.log('[ElectronOverlay] window.require:', window.require);

		this.hasElectronAPI = !!window.electronAPI;
		this.hasGameInfoMethod = !!window.electronAPI?.getRunningGameInfo;

		// Try electronAPI first
		if (this.hasGameInfoMethod) {
			try {
				this.gameInfo = await window.electronAPI.getRunningGameInfo();
				console.log('[ElectronOverlay] Legacy ElectronAPI result:', this.gameInfo);
			} catch (error) {
				console.error('[ElectronOverlay] Legacy ElectronAPI error:', error);
			}
		}
		// Fallback to direct IPC if nodeIntegration is enabled
		else if (window.require) {
			try {
				console.log('[ElectronOverlay] Trying direct IPC access...');
				const { ipcRenderer } = window.require('electron');
				this.gameInfo = await ipcRenderer.invoke('get-running-game-info');
				console.log('[ElectronOverlay] Direct IPC result:', this.gameInfo);
				this.hasGameInfoMethod = true; // Mark as working
			} catch (error) {
				console.error('[ElectronOverlay] Direct IPC error:', error);
			}
		}

		this.tested = true;
	}

	private async initGameStatusService() {
		console.log('[ElectronOverlay] Initializing GameStatusService...');

		try {
			// Wait for service to be ready
			await this.gameStatusService.isReady();
			this.gameStatusReady = true;
			console.log('[ElectronOverlay] GameStatusService is ready');

			// Get initial game status
			this.inGame = await this.gameStatusService.inGame();
			console.log('[ElectronOverlay] Initial game status:', this.inGame);

			// Subscribe to game status changes
			const subscription = this.gameStatusService.inGame$$.subscribe((inGame) => {
				console.log('[ElectronOverlay] Game status changed:', inGame);
				this.inGame = inGame;
			});
			this.subscriptions.push(subscription);
		} catch (error) {
			console.error('[ElectronOverlay] GameStatusService initialization error:', error);
		}
	}

	private setupPeriodicUpdates() {
		// Refresh legacy API every 5 seconds for comparison
		if (this.hasGameInfoMethod || window.require) {
			setInterval(async () => {
				try {
					if (window.electronAPI?.getRunningGameInfo) {
						this.gameInfo = await window.electronAPI.getRunningGameInfo();
					} else if (window.require) {
						const { ipcRenderer } = window.require('electron');
						this.gameInfo = await ipcRenderer.invoke('get-running-game-info');
					}
				} catch (error) {
					console.error('[ElectronOverlay] Refresh error:', error);
				}
			}, 5000);
		}
	}
}
