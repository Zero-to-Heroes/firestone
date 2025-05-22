/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Injectable } from '@angular/core';
import { IReviewIdService, REVIEW_ID_SERVICE_TOKEN } from '@firestone/game-state';
import { CONSTRUCTED_DISCOVERS_DAILY_FREE_USES } from '@firestone/shared/common/service';
import {
	AbstractFacadeService,
	AppInjector,
	LocalStorageService,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { BehaviorSubject, debounceTime } from 'rxjs';

@Injectable()
export class ConstructedDiscoversGuardianService extends AbstractFacadeService<ConstructedDiscoversGuardianService> {
	public freeUsesLeft$$: BehaviorSubject<number>;

	private localStorage: LocalStorageService;
	private reviewIdService: IReviewIdService;

	private useCountUpdater$$ = new BehaviorSubject<void>(undefined);

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'ConstructedDiscoversGuardianService', () => !!this.freeUsesLeft$$);
	}

	protected override assignSubjects() {
		this.freeUsesLeft$$ = this.mainInstance.freeUsesLeft$$;
	}

	protected async init() {
		this.freeUsesLeft$$ = new BehaviorSubject<number>(CONSTRUCTED_DISCOVERS_DAILY_FREE_USES);
		this.localStorage = AppInjector.get(LocalStorageService);
		this.reviewIdService = AppInjector.get(REVIEW_ID_SERVICE_TOKEN);

		const freeUseCount = this.localStorage.getItem<FreeUseCount>(
			LocalStorageService.LOCAL_STORAGE_CONSTRUCTED_DISCOVER_STATS_SEEN,
		);
		const today = new Date().toISOString().substring(0, 10);
		const todaysCount = freeUseCount?.day === today ? freeUseCount.gameIds?.length : 0;
		console.log('[constructed-discover-guardian] use count in init', today, todaysCount);
		this.freeUsesLeft$$.next(Math.max(0, CONSTRUCTED_DISCOVERS_DAILY_FREE_USES - todaysCount));

		this.useCountUpdater$$.pipe(debounceTime(500)).subscribe(() => this.updateUseCount());
	}

	public acknowledgeDiscoverStatsSeen() {
		this.mainInstance.acknowledgeDiscoverStatsSeenInternal();
	}

	private acknowledgeDiscoverStatsSeenInternal() {
		this.useCountUpdater$$.next(undefined);
	}

	private async updateUseCount() {
		const freeUseCount = this.localStorage.getItem<FreeUseCount>(
			LocalStorageService.LOCAL_STORAGE_CONSTRUCTED_DISCOVER_STATS_SEEN,
		);
		const today = new Date().toISOString().substring(0, 10);
		const gamesUsedToday = freeUseCount?.day === today ? freeUseCount.gameIds : [];
		const currentGameId: string | null = this.reviewIdService.reviewId$.value;
		if (!currentGameId) {
			return;
		}

		const newGames = [...new Set([...gamesUsedToday, currentGameId])];
		const newCount = newGames.length;
		const newFreeUse: FreeUseCount = {
			day: today,
			gameIds: newGames,
		};
		this.localStorage.setItem(LocalStorageService.LOCAL_STORAGE_CONSTRUCTED_DISCOVER_STATS_SEEN, newFreeUse);
		console.log('[constructed-discover-guardian] new use count', today, newCount);
		this.freeUsesLeft$$.next(Math.max(0, CONSTRUCTED_DISCOVERS_DAILY_FREE_USES - newCount));
	}
}

interface FreeUseCount {
	readonly day: string;
	readonly gameIds: readonly string[];
}
