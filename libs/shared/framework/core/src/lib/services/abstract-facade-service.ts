import { sleep, SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { BehaviorSubject } from 'rxjs';
import { AppInjector } from './app-injector';
import { isElectronContext, isMainProcess } from './electron-utils';
import { WindowManagerService } from './window-manager.service';

export abstract class AbstractFacadeService<T extends AbstractFacadeService<T>> {
	protected mainInstance: T;

	protected isElectronContext: boolean;
	protected debug = false;

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
		// Make sure the injector is registered
		await AppInjector?.awaitReady?.();
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
				await this.init();
				await this.initElectronMainProcess();
			} else {
				// We're in a renderer process, create IPC proxy
				this.mainInstance = this as unknown as T;
				const { ipcRenderer } = (window as any).require('electron');
				await this.createElectronProxy(ipcRenderer);
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

	/**
	 * Wire an Electron BehaviorSubject across main ↔ renderer.
	 *
	 * - `serialize` runs once before IPC send (shrink / make clone-safe).
	 * - `hydrate` runs once after IPC receive (restore class instances).
	 * Main keeps the raw domain value on local `next`; only the wire payload is transformed.
	 */
	protected setupElectronSubject<V>(
		obs: BehaviorSubject<V>,
		eventName: string,
		transform: ElectronSubjectTransform<V> = {},
	) {
		if (!obs) {
			throw new Error(`[${this.constructor.name}] setupElectronSubject: ${eventName} subject is undefined`);
		}
		const serialize = transform.serialize ?? ((value: V) => value);
		const hydrate = transform.hydrate ?? ((value: V) => value);

		if (isMainProcess()) {
			const { ipcMain } = eval('require')('electron');
			if (typeof ipcMain !== 'undefined') {
				// Send updates only to the webContents that actually consume this subject
				// (Plan G/D, docs/electron-memory-investigation.md): the previous blind
				// getAllWindows() fan-out structured-cloned every update into every window
				// (ads / owepm / windows that never read the channel included) — measured
				// at 71.5 s of main-thread time in one BG game for game-state-facade
				// alone. Renderers announce themselves through the initial-value invoke
				// and an explicit `<eventName>-subscribe` message.
				const subscribers = new Set<any>();
				const addSubscriber = (sender: any) => {
					if (!sender || sender.isDestroyed?.() || subscribers.has(sender)) {
						return;
					}
					subscribers.add(sender);
					sender.once('destroyed', () => subscribers.delete(sender));
				};
				const sendToSubscribers = (channel: string, data: any) => {
					for (const sender of subscribers) {
						if (sender.isDestroyed()) {
							continue;
						}
						try {
							sender.send(channel, data);
						} catch (error) {
							// Render frame might be disposed even if the webContents isn't destroyed
							console.debug(`[${this.constructor.name}] error sending ${channel} to renderer`, error);
						}
					}
				};

				const subscribeChannel = `${eventName}-subscribe`;
				ipcMain.removeAllListeners(subscribeChannel);
				ipcMain.on(subscribeChannel, (event: any) => addSubscriber(event.sender));

				ipcMain.removeHandler(eventName);
				ipcMain.handle(eventName, async (event: any) => {
					addSubscriber(event.sender);
					const value =
						obs instanceof SubscriberAwareBehaviorSubject
							? await obs.getValueWithInit()
							: await obs.getValue();
					// Serialize before IPC: structured clone runs on the main→renderer return value.
					return serialize(value);
				});
				const originalNext = obs.next.bind(obs);
				obs.next = (value: V) => {
					originalNext(value);
					if (!subscribers.size) {
						// No consumer yet: skip the serialize too, it can be expensive
						return;
					}
					// Stall-attribution hook installed by the platform instrumentation
					// (no-op otherwise): splits serialize cost from the IPC send
					// (structured clone happens inside webContents.send)
					const perfHook = (globalThis as any).__fsSlowOp;
					if (perfHook) {
						const serializeStart = performance.now();
						const wire = serialize(value);
						const sendStart = performance.now();
						sendToSubscribers(eventName, wire);
						const sendEnd = performance.now();
						perfHook('ipc', eventName, sendEnd - serializeStart, {
							serializeMs: Math.round(sendStart - serializeStart),
							sendMs: Math.round(sendEnd - sendStart),
							targets: subscribers.size,
						});
					} else {
						sendToSubscribers(eventName, serialize(value));
					}
				};
				// Listen for updates from renderer processes
				const updateChannel = `${eventName}-update`;
				ipcMain.removeAllListeners(updateChannel);
				ipcMain.on(updateChannel, (event: any, wire: V) => {
					addSubscriber(event.sender);
					// Hydrate into main subject; rebroadcast the same wire payload (already serialized).
					originalNext(hydrate(wire));
					sendToSubscribers(eventName, wire);
				});
			}
		} else {
			const { ipcRenderer } = (window as any).require('electron');
			if (typeof ipcRenderer !== 'undefined') {
				// Track if we're currently processing an IPC update to prevent infinite loops
				const updateChannel = `${eventName}-update`;
				const isProcessingIpcUpdate = Symbol('isProcessingIpcUpdate');
				(obs as any)[isProcessingIpcUpdate] = false;

				const applyHydratedFromIpc = (wire: V) => {
					(obs as any)[isProcessingIpcUpdate] = true;
					obs.next(hydrate(wire));
					Promise.resolve().then(() => {
						(obs as any)[isProcessingIpcUpdate] = false;
					});
				};

				// Listen for updates from main process
				ipcRenderer.on(eventName, (_, wire: V) => {
					applyHydratedFromIpc(wire);
				});
				// Tell main we consume this channel, so it only fans updates out to actual
				// consumers. The initial-value invoke below also registers us, but that can
				// fail if the main handler isn't up yet, so announce explicitly too.
				ipcRenderer.send(`${eventName}-subscribe`);

				// Wrap next() to send updates to main process when called locally
				const originalNext = obs.next.bind(obs);
				obs.next = (value: V) => {
					originalNext(value);
					// Only send to main if this is a local update (not from IPC)
					if (!(obs as any)[isProcessingIpcUpdate]) {
						ipcRenderer.send(updateChannel, serialize(value));
					}
				};

				try {
					Promise.resolve(ipcRenderer.invoke(eventName))
						.then((wire: V) => {
							applyHydratedFromIpc(wire);
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
	 * Register a method that receives the IPC event (e.g. to get sender's BrowserWindow).
	 * Use when the handler needs event.sender to identify the calling renderer.
	 */
	protected registerMainProcessMethodWithEvent(
		methodName: string,
		handler: (event: any, ...args: any[]) => Promise<any> | any,
	): void {
		if (isMainProcess()) {
			const { ipcMain } = eval('require')('electron');
			if (typeof ipcMain !== 'undefined') {
				const channel = `${this.serviceName}-${methodName}`;
				ipcMain.removeHandler(channel);
				ipcMain.handle(channel, async (event: any, ...args: any[]) => {
					try {
						return await handler(event, ...args);
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
		if (isElectronContext() && !isMainProcess()) {
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
	return Promise.all(services.filter((service) => service != null).map((service) => service.isReady()));
};

/** Optional IPC transforms for {@link AbstractFacadeService.setupElectronSubject}. */
export type ElectronSubjectTransform<V> = {
	/** Before sending over IPC (main→renderer and renderer→main). */
	serialize?: (value: V) => V;
	/** After receiving over IPC (both directions). */
	hydrate?: (value: V) => V;
};

interface HasIsReady {
	isReady(): Promise<void>;
}
