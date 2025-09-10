import { sleep } from '@firestone/shared/framework/common';
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
		this.isElectronContext =
			(typeof window !== 'undefined' && (window as any).electronAPI !== undefined) ||
			(typeof process !== 'undefined' && process.versions?.electron !== undefined);
		// Check if the service is already initialized, which is useful for single-window apps, like
		// the website
		if (isMainWindow && !window[this.serviceName]) {
			window[this.serviceName] = this;
			this.mainInstance = this as unknown as T;
			this.init();
		} else if (this.isElectronContext) {
			// Here is the harder part:
			// - The implementing services all declare properties that need to be synchronized from the main process, in the assignSubjects method
			// - However, they are currently defined assuming we are in an Overwolf context, where we can share object instances
			// - When we're in an electron context, we can't share object instances, so we need to find a way to synchronize the data
		} else {
			const mainWindow = await this.windowManager.getMainWindow();
			this.mainInstance = mainWindow[this.serviceName];
			this.assignSubjects();
		}
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
