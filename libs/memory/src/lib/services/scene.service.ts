import { Injectable } from '@angular/core';
import { SceneMode } from '@firestone-hs/reference-data';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { AbstractFacadeService, AppInjector, WindowManagerService } from '@firestone/shared/framework/core';
import { MemoryInspectionService } from './memory-inspection.service';
import { MemoryUpdatesService } from './memory-updates.service';

@Injectable()
export class SceneService extends AbstractFacadeService<SceneService> {
	public currentScene$$: SubscriberAwareBehaviorSubject<SceneMode | null>;
	public lastNonGamePlayScene$$: SubscriberAwareBehaviorSubject<SceneMode | null>;

	private memory: MemoryInspectionService;
	private memoryUpdates: MemoryUpdatesService;

	private internalSubscriber$$ = new SubscriberAwareBehaviorSubject<void | null>(null);

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'sceneService', () => !!this.currentScene$$ && !!this.lastNonGamePlayScene$$);
	}

	protected override assignSubjects() {
		this.currentScene$$ = this.mainInstance.currentScene$$;
		this.lastNonGamePlayScene$$ = this.mainInstance.lastNonGamePlayScene$$;
	}

	protected async init() {
		this.currentScene$$ = new SubscriberAwareBehaviorSubject<SceneMode | null>(null);
		this.lastNonGamePlayScene$$ = new SubscriberAwareBehaviorSubject<SceneMode | null>(null);
		this.memory = AppInjector.get(MemoryInspectionService);
		this.memoryUpdates = AppInjector.get(MemoryUpdatesService);

		this.currentScene$$.onFirstSubscribe(async () => {
			this.internalSubscriber$$.subscribe();
		});
		this.lastNonGamePlayScene$$.onFirstSubscribe(async () => {
			this.internalSubscriber$$.subscribe();
		});

		this.internalSubscriber$$.onFirstSubscribe(async () => {
			console.debug('[scene-service] init');
			const scene = await this.memory.getCurrentSceneFromMindVision();
			console.debug('[scene-service] init - got scene', scene);
			this.updateScene(scene);
			console.debug(
				'[scene-service] init - updated scene',
				this.currentScene$$.value,
				this.lastNonGamePlayScene$$.value,
			);

			this.memoryUpdates.memoryUpdates$$.subscribe((changes) => {
				const newScene = changes.CurrentScene;
				this.updateScene(newScene);
			});
		});
	}

	private updateScene(scene: SceneMode | null) {
		if (!scene) {
			return;
		}

		this.currentScene$$.next(scene);
		if (scene !== SceneMode.GAMEPLAY) {
			this.lastNonGamePlayScene$$.next(scene);
		} else if (this.lastNonGamePlayScene$$.value === null) {
			this.lastNonGamePlayScene$$.next(null);
		}
	}
}
