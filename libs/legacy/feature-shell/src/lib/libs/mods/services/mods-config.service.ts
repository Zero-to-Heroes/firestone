import { Injectable } from '@angular/core';
import { LocalStorageService } from '@legacy-import/src/lib/js/services/local-storage';
import { BehaviorSubject } from 'rxjs';
import { ModsConfig } from '../model/mods-config';

@Injectable()
export class ModsConfigService {
	public conf$$ = new BehaviorSubject<ModsConfig>({});

	constructor(private readonly localStorage: LocalStorageService) {
		window['modsConfig'] = this.conf$$;
		this.init();
	}

	public updateConf(newConf: ModsConfig) {
		this.localStorage.setItem('mods-config', newConf);
		this.conf$$.next(newConf);
	}

	public getConfig(): ModsConfig {
		return this.localStorage.getItem<ModsConfig>('mods-config') ?? {};
	}

	private init() {
		const modsConfig = this.getConfig();
		this.updateConf(modsConfig);
	}
}
