/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Injectable, isDevMode } from '@angular/core';
import {
	AbstractFacadeService,
	AppInjector,
	LocalStorageService,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class BgsIntermediateResultsSimGuardianService extends AbstractFacadeService<BgsIntermediateResultsSimGuardianService> {
	public freeUsesLeft$$: BehaviorSubject<number>;

	private localStorage: LocalStorageService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'BgsIntermediateResultsSimService', () => !!this.freeUsesLeft$$);
	}

	protected override assignSubjects() {
		this.freeUsesLeft$$ = this.mainInstance.freeUsesLeft$$;
	}

	protected async init() {
		this.freeUsesLeft$$ = new BehaviorSubject<number>(0);
		this.localStorage = AppInjector.get(LocalStorageService);

		this.addDevMode();
	}

	public hasFreeUses(gameId: string): boolean {
		// Don't paywall it anymore
		return true;
	}

	private addDevMode() {
		// Only add dev functions in development mode
		if (!isDevMode()) {
			return;
		}

		window['resetBgsIntermediateSimsDailyUses'] = () => {
			this.localStorage.setItem(LocalStorageService.LOCAL_STORAGE_BGS_INTERMEDIATE_RESULTS_GAMES_USED, null);
		};
	}
}

interface FreeUseCount {
	day: string;
	gameIds: string[];
}
