import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';

declare const window: any;

@Component({
	selector: 'electron-overlay',
	standalone: false,
	template: `
		<div class="electron-overlay-container">
			<!-- Game Info Test -->
			<div class="debug-info">
				<h2>🔥 Firestone Electron Overlay</h2>
				<p>Angular renderer process running</p>

				<div *ngIf="gameInfo" class="game-info-section">
					<h3>🎮 Game Info Test</h3>
					<p><strong>Game:</strong> {{ gameInfo.displayName }}</p>
					<p><strong>Size:</strong> {{ gameInfo.width }}x{{ gameInfo.height }}</p>
					<p><strong>Focused:</strong> {{ gameInfo.isInFocus ? '✅' : '❌' }}</p>
					<p><strong>Running:</strong> {{ gameInfo.isRunning ? '✅' : '❌' }}</p>
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
export class ElectronOverlayComponent implements OnInit {
	gameInfo: any = null;
	tested = false;
	hasElectronAPI = false;
	hasGameInfoMethod = false;

	constructor() {
		console.log('[ElectronOverlay] Angular overlay component initialized');
	}

	async ngOnInit() {
		console.log('[ElectronOverlay] Testing ElectronAPI...');
		console.log('[ElectronOverlay] window:', window);
		console.log('[ElectronOverlay] window.electronAPI:', window.electronAPI);
		console.log('[ElectronOverlay] window.electron:', window.electron);
		console.log('[ElectronOverlay] window.require:', window.require);
		console.log('[ElectronOverlay] Available window properties:', Object.keys(window));

		this.hasElectronAPI = !!window.electronAPI;
		this.hasGameInfoMethod = !!window.electronAPI?.getRunningGameInfo;

		// Try electronAPI first
		if (this.hasGameInfoMethod) {
			try {
				this.gameInfo = await window.electronAPI.getRunningGameInfo();
				console.log('[ElectronOverlay] ElectronAPI result:', this.gameInfo);
			} catch (error) {
				console.error('[ElectronOverlay] ElectronAPI error:', error);
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

		// Refresh every 5 seconds to see updates
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
