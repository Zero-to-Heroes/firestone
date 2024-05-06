import { sleep } from '@firestone/shared/framework/common';
import { WindowManagerService } from './window-manager.service';

export abstract class AbstractFacadeService<T extends AbstractFacadeService<T>> {
	protected mainInstance: T;

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
		if (isMainWindow) {
			window[this.serviceName] = this;
			this.mainInstance = this as unknown as T;
			this.init();
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
