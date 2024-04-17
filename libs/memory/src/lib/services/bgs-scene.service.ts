import { Injectable } from '@angular/core';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { AbstractFacadeService, AppInjector, WindowManagerService } from '@firestone/shared/framework/core';
import { MemoryInspectionService } from './memory-inspection.service';
import { MemoryUpdatesService } from './memory-updates.service';

@Injectable()
export class BgsSceneService extends AbstractFacadeService<BgsSceneService> {
	public currentMode$$: SubscriberAwareBehaviorSubject<'solo' | 'duos' | null>;

	private memory: MemoryInspectionService;
	private memoryUpdates: MemoryUpdatesService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'BgsSceneService', () => !!this.currentMode$$);
	}

	protected override assignSubjects() {
		this.currentMode$$ = this.mainInstance.currentMode$$;
	}

	protected async init() {
		this.currentMode$$ = new SubscriberAwareBehaviorSubject<'solo' | 'duos' | null>(null);
		this.memory = AppInjector.get(MemoryInspectionService);
		this.memoryUpdates = AppInjector.get(MemoryUpdatesService);

		this.currentMode$$.onFirstSubscribe(async () => {
			console.debug('[bgs-scene-service] init');
			const mode = await this.memory.getBattlegroundsSelectedMode();
			console.debug('[bgs-scene-service] init - got mode', mode);
			this.currentMode$$.next(mode);
			console.debug('[bgs-scene-service] init - updated mode', this.currentMode$$.value);

			this.memoryUpdates.memoryUpdates$$.subscribe((changes) => {
				const mode = changes.BattlegroundsSelectedGameMode;
				if (!!mode) {
					console.debug('[bgs-scene-service] updated mode', mode, changes);
					this.currentMode$$.next(mode as 'solo' | 'duos' | null);
				}
			});
		});
	}
}
