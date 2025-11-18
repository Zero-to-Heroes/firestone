/* eslint-disable @typescript-eslint/no-use-before-define */
import { Injectable } from '@angular/core';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractFacadeService, ApiRunner, AppInjector, WindowManagerService } from '@firestone/shared/framework/core';

const BGS_ANOMALIES_URL = 'https://static.zerotoheroes.com/api/bgs/anomalies-list.gz.json';

@Injectable({ providedIn: 'root' })
export class BattlegroundsAnomaliesService extends AbstractFacadeService<BattlegroundsAnomaliesService> {
	private prefs: PreferencesService;
	private api: ApiRunner;

	private ready = false;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'BattlegroundsAnomaliesService', () => this.ready);
	}

	protected override assignSubjects() {
		// this.anomalies$$ = this.mainInstance.anomalies$$;
		this.ready = this.mainInstance.ready;
	}

	protected async init() {
		console.debug('[bgs-anomalies] init');
		// this.anomalies$$ = new SubscriberAwareBehaviorSubject<readonly string[] | null>(null);
		this.api = AppInjector.get(ApiRunner);
		this.prefs = AppInjector.get(PreferencesService);
		this.ready = true;
		console.debug('[bgs-anomalies] ready');

		await this.prefs.isReady();
	}

	public async loadAllAnomalies(): Promise<readonly string[] | null> {
		return this.mainInstance.loadAllAnomaliesInternal();
	}

	private async loadAllAnomaliesInternal(): Promise<readonly string[] | null> {
		const anomalies: readonly string[] | null = await this.api.callGetApi(BGS_ANOMALIES_URL);
		console.debug('[bgs-anomalies] loaded quests', anomalies);
		return anomalies;
	}
}
