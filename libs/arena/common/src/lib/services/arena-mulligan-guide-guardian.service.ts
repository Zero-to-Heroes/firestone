/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Injectable } from '@angular/core';
import {
	AbstractFacadeService,
	AppInjector,
	LocalStorageService,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';

export const MULLIGAN_GUIDE_IS_ENABLED = true;
export const DAILY_FREE_USES = 3;

@Injectable()
export class ArenaMulliganGuideGuardianService extends AbstractFacadeService<ArenaMulliganGuideGuardianService> {
	public freeUsesLeft$$: BehaviorSubject<number>;

	private localStorage: LocalStorageService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'ArenaMulliganGuideGuardianService', () => !!this.freeUsesLeft$$);
	}

	protected override assignSubjects() {
		this.freeUsesLeft$$ = this.mainInstance.freeUsesLeft$$;
	}

	protected async init() {
		this.freeUsesLeft$$ = new BehaviorSubject<number>(DAILY_FREE_USES);
		this.localStorage = AppInjector.get(LocalStorageService);

		const freeUseCount = this.localStorage.getItem<FreeUseCount>(
			LocalStorageService.LOCAL_STORAGE_ARENA_MULLIGAN_ADVICE_SEEN,
		);
		const today = new Date().toISOString().substring(0, 10);
		const todaysCount = freeUseCount?.day === today ? freeUseCount.count : 0;
		console.log('[mulligan-arena-guide-guardian] use count in init', today, todaysCount);
		this.freeUsesLeft$$.next(Math.max(0, DAILY_FREE_USES - todaysCount));

		this.addDevMode();
	}

	public acknowledgeMulliganAdviceSeen() {
		this.mainInstance.acknowledgeMulliganAdviceSeenInternal();
	}

	private acknowledgeMulliganAdviceSeenInternal() {
		const freeUseCount = this.localStorage.getItem<FreeUseCount>(
			LocalStorageService.LOCAL_STORAGE_ARENA_MULLIGAN_ADVICE_SEEN,
		);
		const today = new Date().toISOString().substring(0, 10);
		const newCount = freeUseCount?.day === today ? freeUseCount.count + 1 : 1;
		this.localStorage.setItem(LocalStorageService.LOCAL_STORAGE_ARENA_MULLIGAN_ADVICE_SEEN, {
			day: today,
			count: newCount,
		});
		console.log('[mulligan-arena-guide-guardian] new use count', today, newCount);
		this.freeUsesLeft$$.next(Math.max(0, DAILY_FREE_USES - newCount));
	}

	private addDevMode() {
		if (process.env['NODE_ENV'] === 'production') {
			return;
		}

		window['resetDailyUses'] = () => {
			this.localStorage.setItem(LocalStorageService.LOCAL_STORAGE_ARENA_MULLIGAN_ADVICE_SEEN, null);
			this.freeUsesLeft$$.next(DAILY_FREE_USES);
		};
	}
}

interface FreeUseCount {
	readonly day: string;
	readonly count: number;
}
