/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Injectable } from '@angular/core';
import {
	AbstractFacadeService,
	AppInjector,
	LocalStorageService,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';

export const DAILY_FREE_USES = 2;

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
		this.freeUsesLeft$$ = new BehaviorSubject<number>(DAILY_FREE_USES);
		this.localStorage = AppInjector.get(LocalStorageService);

		this.addDevMode();
	}

	public hasFreeUses(gameId: string): boolean {
		// Don't paywall it anymore
		return true;
		// Using it in the simulator
		if (!gameId) {
			return true;
		}
		const today = new Date().toISOString().substring(0, 10);
		let freeUseCount = this.localStorage.getItem<FreeUseCount>(
			LocalStorageService.LOCAL_STORAGE_BGS_INTERMEDIATE_RESULTS_GAMES_USED,
		);
		if (!freeUseCount?.day) {
			freeUseCount = { day: today, gameIds: [] };
		}
		const gamesToday = freeUseCount?.day === today ? freeUseCount.gameIds : [];
		if (gamesToday.includes(gameId)) {
			return true;
		}
		if (gamesToday.length >= DAILY_FREE_USES) {
			console.debug(
				'[bgs-sim-intermediate-results-guardian] [debug] no more free uses today',
				gamesToday,
				gameId,
			);
			return false;
		}

		gamesToday.push(gameId);
		freeUseCount.day = today;
		freeUseCount.gameIds = gamesToday;
		console.log('[bgs-sim-intermediate-results-guardian] use count', freeUseCount);
		this.localStorage.setItem(LocalStorageService.LOCAL_STORAGE_BGS_INTERMEDIATE_RESULTS_GAMES_USED, freeUseCount);
		this.freeUsesLeft$$.next(DAILY_FREE_USES - freeUseCount.gameIds.length);
		return freeUseCount.gameIds.length <= DAILY_FREE_USES;
	}

	private addDevMode() {
		if (process.env['NODE_ENV'] === 'production') {
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
