import { sleep } from '@firestone/shared/framework/common';
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
		if (isMainWindow && !window[this.serviceName]) {
			window[this.serviceName] = this;
			this.mainInstance = this as unknown as T;
			this.init();
		} else if (this.isElectronContext) {
			// In Electron context, we need to handle main vs renderer process differently
			if (isMainProcess()) {
				// We're in the main process, initialize normally like a main window
				window[this.serviceName] = this;
				this.mainInstance = this as unknown as T;
				this.init();
			} else {
				// We're in a renderer process, create IPC proxy
				this.mainInstance = this as unknown as T;
				this.createElectronProxy();
			}
		} else {
			const mainWindow = await this.windowManager.getMainWindow();
			this.mainInstance = mainWindow[this.serviceName];
			this.assignSubjects();
		}
	}

	protected createElectronProxy(): void | Promise<void> {
		// Do nothing by default
		console.warn(this.constructor.name, 'createElectronProxy not implemented');
	}

	protected abstract assignSubjects(): void;
	protected abstract init(): void | Promise<void>;
}

export const waitForReady = async (...services: HasIsReady[]) => {
	return Promise.all(services.map((service) => service.isReady()));
};

interface HasIsReady {
	isReady(): Promise<void>;
}
