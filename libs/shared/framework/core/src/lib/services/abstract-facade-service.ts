import { sleep, SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { BehaviorSubject } from 'rxjs';
import { isElectronContext, isMainProcess } from './electron-utils';
import { WindowManagerService } from './window-manager.service';

export abstract class AbstractFacadeService<T extends AbstractFacadeService<T>> {
	protected mainInstance: T;

	protected isElectronContext: boolean;

	constructor(
		protected readonly windowManager: WindowManagerService,
		private readonly serviceName: string,
		private readonly readyCheck: () => boolean,
	) {
		this.initFacade();
	}

	public async isReady() {
		while (!this.readyCheck()) {
			await sleep(50);
		}
	}

	private async initFacade() {
		const isMainWindow = await this.windowManager.isMainWindow();
		this.isElectronContext = isElectronContext();
		console.debug('[abstract-facade-service] isElectronContext', this.isElectronContext);
		// Check if the service is already initialized, which is useful for single-window apps, like
		// the website
		if (this.isElectronContext) {
			// In Electron context, we need to handle main vs renderer process differently
			if (isMainProcess()) {
				console.debug('[abstract-facade-service] isMainProcess');
				// We're in the main process, initialize normally like a main window
				// window[this.serviceName] = this;
				this.mainInstance = this as unknown as T;
				this.init();
				this.initElectronMainProcess();
			} else {
				console.debug('[abstract-facade-service] isRendererProcess');
				// We're in a renderer process, create IPC proxy
				this.mainInstance = this as unknown as T;
				const { ipcRenderer } = (window as any).require('electron');
				this.createElectronProxy(ipcRenderer);
			}
			this.initElectronSubjects();
		} else {
			if (isMainWindow && !window[this.serviceName]) {
				window[this.serviceName] = this;
				this.mainInstance = this as unknown as T;
				this.init();
			} else {
				const mainWindow = await this.windowManager.getMainWindow();
				this.mainInstance = mainWindow[this.serviceName];
				this.assignSubjects();
			}
		}
	}

	protected createElectronProxy(ipcRenderer: any): void | Promise<void> {
		// Do nothing by default
		console.warn(this.constructor.name, 'createElectronProxy not implemented');
	}
	protected async initElectronMainProcess() {
		console.warn(this.constructor.name, 'initElectronMainProcess not implemented');
	}

	protected abstract assignSubjects(): void;
	protected abstract init(): void | Promise<void>;

	protected broadcastToRenderers(channel: string, data: any): void {
		// Import BrowserWindow dynamically to avoid issues in renderer process
		try {
			// Use eval to prevent bundler from trying to include electron in frontend builds
			const { BrowserWindow } = eval('require')('electron');
			BrowserWindow.getAllWindows().forEach((window: any) => {
				if (!window.isDestroyed()) {
					window.webContents.send(channel, data);
				}
			});
		} catch (error) {
			console.debug('[game-status] Could not broadcast to renderers:', error);
		}
	}

	protected initElectronSubjects() {
		console.warn(this.constructor.name, 'initElectron not implemented');
	}

	protected setupElectronSubject<T>(obs: BehaviorSubject<T>, eventName: string) {
		if (isMainProcess()) {
			const { ipcMain } = eval('require')('electron');
			if (typeof ipcMain !== 'undefined') {
				ipcMain.handle(eventName, async () => {
					if (obs instanceof SubscriberAwareBehaviorSubject) {
						return await obs.getValueWithInit();
					} else {
						return await obs.getValue();
					}
				});
				const originalNext = obs.next.bind(obs);
				obs.next = (value: T) => {
					originalNext(value);
					this.broadcastToRenderers(eventName, value);
				};
			}
		} else {
			const { ipcRenderer } = (window as any).require('electron');
			if (typeof ipcRenderer !== 'undefined') {
				ipcRenderer.on(eventName, (_, value: T) => {
					obs.next(value);
				});
			}
		}
	}
}

export const waitForReady = async (...services: HasIsReady[]) => {
	return Promise.all(services.map((service) => service.isReady()));
};

interface HasIsReady {
	isReady(): Promise<void>;
}
