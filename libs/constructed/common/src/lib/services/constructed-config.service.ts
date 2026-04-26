import { Injectable } from '@angular/core';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { AbstractFacadeService, ApiRunner, AppInjector, WindowManagerService } from '@firestone/shared/framework/core';

const CONSTRUCTED_CONFIG_URL = 'https://static.firestoneapp.com/data/constructed-config.json';

@Injectable({ providedIn: 'root' })
export class ConstructedConfigService extends AbstractFacadeService<ConstructedConfigService> {
	public config$$: SubscriberAwareBehaviorSubject<ConstructedConfig | null>;

	private api: ApiRunner;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'ConstructedConfigService', () => !!this.config$$);
	}

	protected override assignSubjects() {
		this.config$$ = this.mainInstance.config$$;
	}

	protected async init() {
		this.config$$ = new SubscriberAwareBehaviorSubject<ConstructedConfig | null>(null);
		this.api = AppInjector.get(ApiRunner);

		this.config$$.onFirstSubscribe(async () => {
			const result: ConstructedConfig | null = await this.api.callGetApi(CONSTRUCTED_CONFIG_URL);
			console.log('[constructed-config] loaded config');
			this.config$$.next(result);
		});
	}

	protected override initElectronSubjects(): void {
		this.setupElectronSubject(this.config$$, 'ConstructedConfigService-config');
	}

	protected override createElectronProxy(ipcRenderer: any): void | Promise<void> {
		this.config$$ = new SubscriberAwareBehaviorSubject<ConstructedConfig | null>(null);
	}
}

export interface ConstructedConfig {
	readonly standardSets: readonly string[];
	readonly vanillaSets: readonly string[];
	readonly wildSets: readonly string[];
	readonly twistSets: readonly string[];
}
