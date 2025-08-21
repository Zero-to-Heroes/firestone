import { BrowserWindow, screen } from 'electron';

export class OverlayService {
	private static instance: OverlayService;

	private overlayWindow: BrowserWindow | null = null;
	private isVisible = false;

	private constructor() {}

	public static getInstance(): OverlayService {
		if (!OverlayService.instance) {
			OverlayService.instance = new OverlayService();
		}
		return OverlayService.instance;
	}

	public async showOverlay(): Promise<void> {
		if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
			this.overlayWindow.show();
			this.isVisible = true;
			console.log('👁️ Overlay shown');
			return;
		}

		console.log('🚀 Creating overlay window...');
		await this.createOverlayWindow();
	}

	public hideOverlay(): void {
		if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
			this.overlayWindow.hide();
			this.isVisible = false;
			console.log('🙈 Overlay hidden');
		}
	}

	public destroyOverlay(): void {
		if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
			this.overlayWindow.destroy();
			this.overlayWindow = null;
			this.isVisible = false;
			console.log('💥 Overlay destroyed');
		}
	}

	public isOverlayVisible(): boolean {
		return this.isVisible && this.overlayWindow && !this.overlayWindow.isDestroyed();
	}

	private async createOverlayWindow(): Promise<void> {
		const primaryDisplay = screen.getPrimaryDisplay();
		const { width, height } = primaryDisplay.workAreaSize;

		this.overlayWindow = new BrowserWindow({
			width: 400,
			height: 200,
			x: Math.floor((width - 400) / 2), // Center horizontally
			y: 100, // Near top of screen
			frame: false,
			transparent: true,
			alwaysOnTop: true,
			skipTaskbar: true,
			resizable: false,
			movable: false,
			minimizable: false,
			maximizable: false,
			closable: false,
			focusable: false,
			webPreferences: {
				nodeIntegration: false,
				contextIsolation: true,
			},
		});

		// Load the overlay HTML
		const overlayHtml = this.createOverlayHtml();
		await this.overlayWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(overlayHtml)}`);

		// Set window properties for overlay behavior
		this.overlayWindow.setIgnoreMouseEvents(true); // Click-through
		this.overlayWindow.setVisibleOnAllWorkspaces(true);
		this.overlayWindow.setAlwaysOnTop(true, 'screen-saver');

		this.overlayWindow.on('closed', () => {
			this.overlayWindow = null;
			this.isVisible = false;
		});

		this.isVisible = true;
		console.log('✨ Overlay window created and shown');
	}

	private createOverlayHtml(): string {
		return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Firestone Overlay</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background: transparent;
              overflow: hidden;
              width: 100vw;
              height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            
            .overlay-container {
              background: rgba(0, 0, 0, 0.8);
              border: 2px solid #ff6b35;
              border-radius: 12px;
              padding: 20px 30px;
              text-align: center;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
              backdrop-filter: blur(5px);
              animation: fadeIn 0.5s ease-in-out;
            }
            
            .title {
              color: #ff6b35;
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 10px;
              text-shadow: 0 2px 4px rgba(0, 0, 0, 0.7);
            }
            
            .subtitle {
              color: #ffffff;
              font-size: 16px;
              opacity: 0.9;
              text-shadow: 0 1px 2px rgba(0, 0, 0, 0.7);
            }
            
            @keyframes fadeIn {
              from {
                opacity: 0;
                transform: translateY(-20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            
            .pulse {
              animation: pulse 2s infinite;
            }
            
            @keyframes pulse {
              0% { transform: scale(1); }
              50% { transform: scale(1.05); }
              100% { transform: scale(1); }
            }
          </style>
        </head>
        <body>
          <div class="overlay-container pulse">
            <div class="title">🔥 Hello World! 🔥</div>
            <div class="subtitle">Firestone Desktop is running</div>
          </div>
        </body>
      </html>
    `;
	}
}
