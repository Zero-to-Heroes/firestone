import { sleep, SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { BehaviorSubject } from 'rxjs';
import { isElectronContext, isMainProcess } from './electron-utils';
import { WindowManagerService } from './window-manager.service';

export abstract class AbstractFacadeService<T extends AbstractFacadeService<T>> {
	protected mainInstance: T;

	protected isElectronContext: boolean;

	// Map to store registered main process methods (methodName -> handler)
	private registeredMainProcessMethods: Map<string, (...args: any[]) => Promise<any> | any> = new Map();

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
		// console.warn(this.constructor.name, 'initElectronMainProcess not implemented');
	}

	protected abstract assignSubjects(): void;
	protected abstract init(): void | Promise<void>;

	protected broadcastToRenderers(channel: string, data: any): void {
		// Import BrowserWindow dynamically to avoid issues in renderer process
		try {
			// Use eval to prevent bundler from trying to include electron in frontend builds
			const { BrowserWindow } = eval('require')('electron');
			BrowserWindow.getAllWindows().forEach((window: any) => {
				const windowInfo = {
					id: window.id,
					title: window.getTitle?.() || 'unknown',
					url: window.webContents?.getURL?.() || 'unknown',
				};

				if (window.isDestroyed()) {
					console.warn(
						`[app] Window is destroyed (should never happen): ID=${windowInfo.id}, Title=${windowInfo.title}, URL=${windowInfo.url}`,
					);
					return;
				}

				if (!window.webContents) {
					console.warn(
						`[app] Window has no webContents (should never happen): ID=${windowInfo.id}, Title=${windowInfo.title}`,
					);
					return;
				}

				if (window.webContents.isDestroyed()) {
					console.warn(
						`[app] Window webContents is destroyed (should never happen): ID=${windowInfo.id}, Title=${windowInfo.title}, URL=${windowInfo.url}`,
					);
					return;
				}

				try {
					window.webContents.send(channel, data);
				} catch (error) {
					// Render frame might be disposed even if window/webContents aren't destroyed
					console.debug(
						`[app] Error sending to renderer: ID=${windowInfo.id}, Title=${windowInfo.title}, URL=${windowInfo.url}`,
						error,
					);
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

	/**
	 * Register a method that should run on the main process.
	 * Call this in initElectronMainProcess() to register methods that need to run in the main process.
	 * @param methodName The name of the method (used as IPC channel identifier)
	 * @param handler The method implementation that will run in the main process
	 */
	protected registerMainProcessMethod(methodName: string, handler: (...args: any[]) => Promise<any> | any): void {
		if (isMainProcess()) {
			// In main process, register IPC handler
			const { ipcMain } = eval('require')('electron');
			if (typeof ipcMain !== 'undefined') {
				const channel = `${this.serviceName}-${methodName}`;
				// Remove existing handler if any (to avoid duplicate registration)
				ipcMain.removeHandler(channel);
				ipcMain.handle(channel, async (_, ...args: any[]) => {
					try {
						const result = await handler(...args);
						return result;
					} catch (error) {
						console.error(`[${this.constructor.name}] Error in main process method ${methodName}:`, error);
						throw error;
					}
				});
				this.registeredMainProcessMethods.set(methodName, handler);
			}
		}
	}

	/**
	 * Call a method on the main process. Works in both Electron and Overwolf/browser contexts.
	 * In Electron renderer: uses IPC to call the method on the main process
	 * In Overwolf/browser: delegates to mainInstance
	 * @param methodName The name of the method to call
	 * @param args Arguments to pass to the method
	 * @returns Promise that resolves with the method's return value
	 */
	protected async callOnMainProcess<T>(methodName: string, ...args: any[]): Promise<T> {
		if (this.isElectronContext && !isMainProcess()) {
			// In Electron renderer process, use IPC
			const { ipcRenderer } = (window as any).require('electron');
			if (typeof ipcRenderer !== 'undefined') {
				const channel = `${this.serviceName}-${methodName}`;
				try {
					return await ipcRenderer.invoke(channel, ...args);
				} catch (error) {
					console.error(`[${this.constructor.name}] Error calling main process method ${methodName}:`, error);
					throw error;
				}
			}
		}
		// In Overwolf/browser context or Electron main process, delegate to mainInstance
		const method = (this.mainInstance as any)[methodName];
		if (typeof method !== 'function') {
			throw new Error(
				`[${this.constructor.name}] Method ${methodName} not found on mainInstance. ` +
					`Make sure to register it using registerMainProcessMethod() in initElectronMainProcess().`,
			);
		}
		return await method.apply(this.mainInstance, args);
	}
}

export const waitForReady = async (...services: HasIsReady[]) => {
	return Promise.all(services.map((service) => service.isReady()));
};

interface HasIsReady {
	isReady(): Promise<void>;
}
