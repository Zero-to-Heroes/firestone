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
		// Check if the service is already initialized, which is useful for single-window apps, like
		// the website
		if (this.isElectronContext) {
			// In Electron context, we need to handle main vs renderer process differently
			if (isMainProcess()) {
				// We're in the main process, initialize normally like a main window
				// window[this.serviceName] = this;
				this.mainInstance = this as unknown as T;
				this.init();
				this.initElectronMainProcess();
			} else {
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
		console.warn(this.constructor.name, 'initElectronSubjects not implemented');
	}

	protected setupElectronSubject<V>(obs: BehaviorSubject<V>, eventName: string) {
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
				obs.next = (value: V) => {
					originalNext(value);
					this.broadcastToRenderers(eventName, value);
				};
				// Listen for updates from renderer processes
				const updateChannel = `${eventName}-update`;
				ipcMain.on(updateChannel, (_, value: V) => {
					const transformedValue = this.transformValueForElectron(value);
					// Apply the update to the main subject using the wrapped next(),
					// which will broadcast to all renderers (including the sender)
					obs.next(transformedValue);
				});
			}
		} else {
			const { ipcRenderer } = (window as any).require('electron');
			if (typeof ipcRenderer !== 'undefined') {
				// Track if we're currently processing an IPC update to prevent infinite loops
				const updateChannel = `${eventName}-update`;
				const isProcessingIpcUpdate = Symbol('isProcessingIpcUpdate');
				(obs as any)[isProcessingIpcUpdate] = false;

				// Listen for updates from main process
				ipcRenderer.on(eventName, (_, value: V) => {
					const transformedValue = this.transformValueForElectron(value);
					// Mark that we're processing an IPC update to prevent sending it back
					(obs as any)[isProcessingIpcUpdate] = true;
					obs.next(transformedValue);
					// Reset the flag after a microtask to ensure the next() call completes
					Promise.resolve().then(() => {
						(obs as any)[isProcessingIpcUpdate] = false;
					});
				});

				// Wrap next() to send updates to main process when called locally
				const originalNext = obs.next.bind(obs);
				obs.next = (value: V) => {
					originalNext(value);
					// Only send to main if this is a local update (not from IPC)
					if (!(obs as any)[isProcessingIpcUpdate]) {
						const transformedValue = this.transformValueForElectron(value);
						ipcRenderer.send(updateChannel, transformedValue);
					}
				};

				try {
					Promise.resolve(ipcRenderer.invoke(eventName))
						.then((value: V) => {
							const transformedValue = this.transformValueForElectron(value);
							// Mark as processing IPC update to prevent sending initial value back
							(obs as any)[isProcessingIpcUpdate] = true;
							obs.next(transformedValue);
							Promise.resolve().then(() => {
								(obs as any)[isProcessingIpcUpdate] = false;
							});
						})
						.catch((error) =>
							console.error(
								`[${this.constructor.name}] could not fetch initial value for ${eventName}`,
								error,
							),
						);
				} catch (error) {
					console.error(`[${this.constructor.name}] error invoking ${eventName}`, error);
				}
			}
		}
	}

	protected transformValueForElectron(value: any): any {
		return value;
	}
}

export const waitForReady = async (...services: HasIsReady[]) => {
	return Promise.all(services.map((service) => service.isReady()));
};

interface HasIsReady {
	isReady(): Promise<void>;
}
