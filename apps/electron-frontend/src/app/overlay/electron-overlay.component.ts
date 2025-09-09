import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
	selector: 'electron-overlay',
	standalone: false,
	template: `
		<div class="electron-overlay-container">
			<!-- For now, just a placeholder that shows we're running Angular -->
			<div class="debug-info">
				<h2>🔥 Firestone Electron Overlay</h2>
				<p>Angular renderer process running</p>
				<p>Ready to integrate full-screen overlays</p>
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
		`,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ElectronOverlayComponent {
	constructor() {
		console.log('[ElectronOverlay] Angular overlay component initialized');
	}
}
