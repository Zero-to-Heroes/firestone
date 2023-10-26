import { Injectable } from '@angular/core';
import { SubscriberAwareBehaviorSubject, sleep } from '@firestone/shared/framework/common';
import { ApiRunner, WindowManagerService } from '@firestone/shared/framework/core';
import { AppInjector } from '@legacy-import/src/lib/js/services/app-injector';
import { DuelsConfig } from '../models/duels-config';

const DUELS_CONFIG_URL = 'https://static.zerotoheroes.com/hearthstone/data/duels-config.json';

@Injectable()
export class DuelsConfigService {
	public duelsConfig$$: SubscriberAwareBehaviorSubject<DuelsConfig | null>;

	private mainInstance: DuelsConfigService;

	private api: ApiRunner;

	constructor(private readonly windowManager: WindowManagerService) {
		this.initFacade();
	}

	public async isReady() {
		while (!this.duelsConfig$$) {
			await sleep(50);
		}
	}

	private async initFacade() {
		const isMainWindow = await this.windowManager.isMainWindow();
		if (isMainWindow) {
			window['duelsConfig'] = this;
			this.mainInstance = this;
			this.init();
		} else {
			const mainWindow = await this.windowManager.getMainWindow();
			this.mainInstance = mainWindow['duelsConfig'];
			this.duelsConfig$$ = this.mainInstance.duelsConfig$$;
		}
	}

	private async init() {
		this.duelsConfig$$ = new SubscriberAwareBehaviorSubject<DuelsConfig | null>(null);
		this.api = AppInjector.get(ApiRunner);

		this.duelsConfig$$.onFirstSubscribe(async () => {
			const result: DuelsConfig | null = await this.api.callGetApi(DUELS_CONFIG_URL);
			console.log('[duels-config] loaded duels config');
			this.duelsConfig$$.next(result);
		});
	}
}
