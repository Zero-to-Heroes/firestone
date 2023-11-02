import { Injectable } from '@angular/core';
import { LocalStorageService, WindowManagerService } from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';
import { ModsConfig } from '../model/mods-config';

@Injectable()
export class ModsConfigService {
	public conf$$ = new BehaviorSubject<ModsConfig>({});

	private isMainNode: boolean;
	// To avoid the boilerplate of using a facade, but maybe there is no choiced
	private mainNode: ModsConfigService;

	constructor(
		private readonly localStorage: LocalStorageService,
		private readonly windowManager: WindowManagerService,
	) {
		this.init();
	}

	public updateConf(newConf: ModsConfig) {
		if (this.isMainNode) {
			this.localStorage.setItem(LocalStorageService.MODS_CONFIG, newConf);
			this.conf$$.next(newConf);
		} else {
			this.mainNode.updateConf(newConf);
		}
	}

	public getConfig(): ModsConfig {
		if (this.isMainNode) {
			return this.localStorage.getItem<ModsConfig>(LocalStorageService.MODS_CONFIG) ?? {};
		} else {
			return this.mainNode.getConfig();
		}
	}

	private async init() {
		const isMainWindow = await this.windowManager.isMainWindow();
		if (isMainWindow) {
			this.isMainNode = true;
			window['modsConfig'] = this.conf$$;
			window['internalModsConfig'] = this;
		} else {
			this.mainNode = (await this.windowManager.getMainWindow())['internalModsConfig'];
		}
		const modsConfig = this.getConfig();
		this.updateConf(modsConfig);
	}
}
