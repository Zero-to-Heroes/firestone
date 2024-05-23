/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Injectable } from '@angular/core';
import {
	AbstractFacadeService,
	AppInjector,
	LocalStorageService,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';

export const DAILY_FREE_USES_HERO = 1;

@Injectable()
export class BgsInGameHeroSelectionGuardianService extends AbstractFacadeService<BgsInGameHeroSelectionGuardianService> {
	public freeUsesLeft$$: BehaviorSubject<number>;

	private localStorage: LocalStorageService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'BgsInGameHeroSelectionGuardianService', () => !!this.freeUsesLeft$$);
	}

	protected override assignSubjects() {
		this.freeUsesLeft$$ = this.mainInstance.freeUsesLeft$$;
	}

	protected async init() {
		this.freeUsesLeft$$ = new BehaviorSubject<number>(DAILY_FREE_USES_HERO);
		this.localStorage = AppInjector.get(LocalStorageService);

		const freeUseCount = this.localStorage.getItem<FreeUseCount>(
			LocalStorageService.LOCAL_STORAGE_BGS_IN_GAME_HERO_SELECTION_STATS_SEEN,
		);
		const today = new Date().toISOString().substring(0, 10);
		const todaysCount = freeUseCount?.day === today ? freeUseCount.count : 0;
		console.log('[bgs-hero-stats-guardian] use count in init', today, todaysCount);
		this.freeUsesLeft$$.next(Math.max(0, DAILY_FREE_USES_HERO - todaysCount));

		this.addDevMode();
	}

	public acknowledgeStatsSeen() {
		this.mainInstance.acknowledgeStatsSeenInternal();
	}

	private acknowledgeStatsSeenInternal() {
		const freeUseCount = this.localStorage.getItem<FreeUseCount>(
			LocalStorageService.LOCAL_STORAGE_BGS_IN_GAME_HERO_SELECTION_STATS_SEEN,
		);
		const today = new Date().toISOString().substring(0, 10);
		const newCount = freeUseCount?.day === today ? freeUseCount.count + 1 : 1;
		this.localStorage.setItem(LocalStorageService.LOCAL_STORAGE_BGS_IN_GAME_HERO_SELECTION_STATS_SEEN, {
			day: today,
			count: newCount,
		});
		console.log(
			'[bgs-hero-stats-guardian] new use count',
			today,
			newCount,
			'free uses leff',
			DAILY_FREE_USES_HERO - newCount,
		);
		this.freeUsesLeft$$.next(Math.max(0, DAILY_FREE_USES_HERO - newCount));
	}

	private addDevMode() {
		if (process.env['NODE_ENV'] === 'production') {
			return;
		}

		window['resetBgsHeroStatsDailyUses'] = () => {
			this.localStorage.setItem(LocalStorageService.LOCAL_STORAGE_BGS_IN_GAME_HERO_SELECTION_STATS_SEEN, null);
			this.freeUsesLeft$$.next(DAILY_FREE_USES_HERO);
		};
	}
}

interface FreeUseCount {
	readonly day: string;
	readonly count: number;
}
