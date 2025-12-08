import { Injectable } from '@angular/core';
import { BnetRegion } from '@firestone-hs/reference-data';
import { AccountInfo, MemoryInspectionService } from '@firestone/memory';
import { GameStatusService, PreferencesService } from '@firestone/shared/common/service';
import { sleep } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	AppInjector,
	waitForReady,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { BehaviorSubject, filter } from 'rxjs';

@Injectable()
export class AccountService extends AbstractFacadeService<AccountService> {
	public region$$: BehaviorSubject<BnetRegion | null>;

	private memory: MemoryInspectionService;
	private gameStatus: GameStatusService;
	private prefs: PreferencesService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'AccountService', () => !!this.region$$);
		window['getRegion'] = async () => {
			const result = await this.getRegion();
			console.log(result);
		};
	}

	protected override assignSubjects() {
		this.region$$ = this.mainInstance.region$$;
	}

	protected async init() {
		// Try a hack to prevent region being null when starting Firestone alongide the game
		this.region$$ = new BehaviorSubject<BnetRegion | null>(null);
		this.memory = AppInjector.get(MemoryInspectionService);
		this.gameStatus = AppInjector.get(GameStatusService);
		this.prefs = AppInjector.get(PreferencesService);
		console.log('[account-service] ready');

		await sleep(1000);
		await waitForReady(this.gameStatus, this.prefs);

		this.region$$.subscribe((region) => {
			if (region) {
				this.prefs.updatePrefs('lastKnownRegion', region);
			}
		});

		const prefs = await this.prefs.getPreferences();
		const lastKnownRegion = prefs.lastKnownRegion;
		if (lastKnownRegion) {
			this.region$$.next(lastKnownRegion);
		}

		this.gameStatus.inGame$$.pipe(filter((inGame) => !!inGame)).subscribe(async () => {
			let region: BnetRegion | null = await this.getRegion();
			while (!region || (region as any) == 0) {
				console.debug('[account-service] region is unknown, waiting for it to be set', region);
				await sleep(1000);
				region = await this.getRegion();
			}
			console.log('[account-service] region', region);
			this.region$$.next(+region);
		});
		// this.gameStatus.inGame$$.pipe(filter((inGame) => !inGame)).subscribe(() => {
		// 	console.log('[account-service] clearing region');
		// 	this.region$$.next(null);
		// });
	}

	public async getRegion(): Promise<BnetRegion | null> {
		return this.memory.getRegion();
	}

	public async getAccountInfo(): Promise<AccountInfo | null> {
		return this.memory.getAccountInfo();
	}
}
