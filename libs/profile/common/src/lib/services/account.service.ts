import { Injectable } from '@angular/core';
import { BnetRegion } from '@firestone-hs/reference-data';
import { MemoryInspectionService } from '@firestone/memory';
import { GameStatusService } from '@firestone/shared/common/service';
import { sleep } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	AppInjector,
	waitForReady,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { BehaviorSubject, filter } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AccountService extends AbstractFacadeService<AccountService> {
	public region$$: BehaviorSubject<BnetRegion | null>;

	private memory: MemoryInspectionService;
	private gameStatus: GameStatusService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'AccountService', () => !!this.region$$);
		window['getRegion'] = async () => {
			const result = await this.memory.getRegion();
			console.log(result);
		};
	}

	protected override assignSubjects() {
		this.region$$ = this.mainInstance.region$$;
	}

	protected async init() {
		// Try a hack to prevent region being null when starting Firestone alongide the game
		await sleep(1000);
		this.region$$ = new BehaviorSubject<BnetRegion | null>(null);
		this.memory = AppInjector.get(MemoryInspectionService);
		this.gameStatus = AppInjector.get(GameStatusService);

		await waitForReady(this.gameStatus);

		this.gameStatus.inGame$$.pipe(filter((inGame) => !!inGame)).subscribe(async () => {
			let region: BnetRegion | null = await this.memory.getRegion();
			while (!region || (region as any) == 0) {
				console.debug('[account-service] region is unknown, waiting for it to be set', region);
				await sleep(1000);
				region = await this.memory.getRegion();
			}
			console.log('[account-service] region', region);
			this.region$$.next(+region);
		});
		this.gameStatus.inGame$$.pipe(filter((inGame) => !inGame)).subscribe(() => {
			console.log('[account-service] clearing region');
			this.region$$.next(null);
		});
	}
}
