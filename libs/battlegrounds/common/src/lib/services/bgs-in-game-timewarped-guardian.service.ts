/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Injectable } from '@angular/core';
import { BGS_TIMEWARPED_DAILY_FREE_USES } from '@firestone/shared/common/service';
import {
	AbstractFacadeService,
	AppInjector,
	LocalStorageService,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class BgsInGameTimewarpedGuardianService extends AbstractFacadeService<BgsInGameTimewarpedGuardianService> {
	public freeUsesLeft$$: BehaviorSubject<number>;

	private localStorage: LocalStorageService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'BgsInGameTimewarpedGuardianService', () => !!this.freeUsesLeft$$);
	}

	protected override assignSubjects() {
		this.freeUsesLeft$$ = this.mainInstance.freeUsesLeft$$;
	}

	protected async init() {
		this.freeUsesLeft$$ = new BehaviorSubject<number>(BGS_TIMEWARPED_DAILY_FREE_USES);
		this.localStorage = AppInjector.get(LocalStorageService);

		const freeUseCount = this.localStorage.getItem<FreeUseCount>(
			LocalStorageService.LOCAL_STORAGE_BGS_IN_GAME_TIMEWARPED_STATS_SEEN,
		);
		const today = new Date().toISOString().substring(0, 10);
		const todaysCount = freeUseCount?.day === today ? freeUseCount.count : 0;
		console.log('[bgs-timewarped-guardian] use count in init', today, todaysCount);
		this.freeUsesLeft$$.next(Math.max(0, BGS_TIMEWARPED_DAILY_FREE_USES - todaysCount));

		this.addDevMode();
	}

	public acknowledgeStatsSeen() {
		this.mainInstance.acknowledgeStatsSeenInternal();
	}

	private acknowledgeStatsSeenInternal() {
		const freeUseCount = this.localStorage.getItem<FreeUseCount>(
			LocalStorageService.LOCAL_STORAGE_BGS_IN_GAME_TIMEWARPED_STATS_SEEN,
		);
		const today = new Date().toISOString().substring(0, 10);
		const newCount = freeUseCount?.day === today ? freeUseCount.count + 1 : 1;
		this.localStorage.setItem(LocalStorageService.LOCAL_STORAGE_BGS_IN_GAME_TIMEWARPED_STATS_SEEN, {
			day: today,
			count: newCount,
		});
		console.log('[bgs-timewarped-guardian] new use count', today, newCount);
		this.freeUsesLeft$$.next(Math.max(0, BGS_TIMEWARPED_DAILY_FREE_USES - newCount));
	}

	private addDevMode() {
		if (process.env['NODE_ENV'] === 'production') {
			return;
		}

		window['resetBgsTimewarpedStatsDailyUses'] = () => {
			this.localStorage.setItem(LocalStorageService.LOCAL_STORAGE_BGS_IN_GAME_TIMEWARPED_STATS_SEEN, null);
			this.freeUsesLeft$$.next(BGS_TIMEWARPED_DAILY_FREE_USES);
		};
	}
}

interface FreeUseCount {
	readonly day: string;
	readonly count: number;
}
