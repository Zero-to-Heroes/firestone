/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Injectable } from '@angular/core';
import { ARENA_DRAFT_WEEKLY_FREE_USES } from '@firestone/shared/common/service';
import { getCurrentWeekStartMonday } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	AppInjector,
	LocalStorageService,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { BehaviorSubject, debounceTime, distinctUntilChanged } from 'rxjs';

@Injectable()
export class ArenaDraftGuardianService extends AbstractFacadeService<ArenaDraftGuardianService> {
	public freeUsesLeft$$: BehaviorSubject<number>;

	private localStorage: LocalStorageService;

	private runIdNotifier$$ = new BehaviorSubject<string | null>(null);

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'ArenaDraftGuardianService', () => !!this.freeUsesLeft$$);
	}

	protected override assignSubjects() {
		this.freeUsesLeft$$ = this.mainInstance.freeUsesLeft$$;
	}

	protected async init() {
		this.freeUsesLeft$$ = new BehaviorSubject<number>(ARENA_DRAFT_WEEKLY_FREE_USES);
		this.localStorage = AppInjector.get(LocalStorageService);

		const freeUseCount = this.localStorage.getItem<FreeUseCount>(
			LocalStorageService.LOCAL_STORAGE_ARENA_DISCOVER_STATS_SEEN,
		);
		// Week in the form of YYYY-WW
		const thisWeek = getCurrentWeekStartMonday();
		const thisWeekCount = freeUseCount?.week === thisWeek ? freeUseCount.runIds?.length : 0;
		console.log('[arena-run-guardian] use count in init', thisWeek, thisWeekCount);
		this.freeUsesLeft$$.next(Math.max(0, ARENA_DRAFT_WEEKLY_FREE_USES - thisWeekCount));

		this.runIdNotifier$$.pipe(debounceTime(1000), distinctUntilChanged()).subscribe((runId) => {
			if (runId) {
				this.updateFreeUseCount(runId);
			}
		});
	}

	public acknowledgeRunUsed(runId: string) {
		this.mainInstance.acknowledgeRunUsedInternal(runId);
	}

	private acknowledgeRunUsedInternal(runId: string) {
		this.runIdNotifier$$.next(runId);
	}

	private updateFreeUseCount(runId: string) {
		const freeUseCount = this.localStorage.getItem<FreeUseCount>(
			LocalStorageService.LOCAL_STORAGE_ARENA_DISCOVER_STATS_SEEN,
		);
		const thisWeek = getCurrentWeekStartMonday();
		const runsUsedToday = freeUseCount?.week === thisWeek ? freeUseCount.runIds : [];
		const newRuns = [...new Set([...runsUsedToday, runId])];
		const newCount = newRuns.length;
		const newFreeUse: FreeUseCount = {
			week: thisWeek,
			runIds: newRuns,
		};
		this.localStorage.setItem(LocalStorageService.LOCAL_STORAGE_ARENA_DISCOVER_STATS_SEEN, newFreeUse);
		console.log('[arena-run-guardian] new use count', thisWeek, newCount, runId);
		this.freeUsesLeft$$.next(Math.max(0, ARENA_DRAFT_WEEKLY_FREE_USES - newCount));
	}
}

interface FreeUseCount {
	readonly week: string;
	readonly runIds: readonly string[];
}
