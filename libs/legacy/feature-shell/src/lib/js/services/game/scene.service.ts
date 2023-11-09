import { Injectable } from '@angular/core';
import { SceneMode } from '@firestone-hs/reference-data';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { AbstractFacadeService, AppInjector, WindowManagerService } from '@firestone/shared/framework/core';
import { MemoryUpdate } from '../../models/memory/memory-update';
import { Events } from '../events.service';
import { MemoryInspectionService } from '../plugins/memory-inspection.service';

@Injectable()
export class SceneService extends AbstractFacadeService<SceneService> {
	public currentScene$$: SubscriberAwareBehaviorSubject<SceneMode | null>;
	public lastNonGamePlayScene$$: SubscriberAwareBehaviorSubject<SceneMode | null>;

	private memory: MemoryInspectionService;
	private events: Events;

	private internalSubscriber$$ = new SubscriberAwareBehaviorSubject<void>(null);

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
		this.events = AppInjector.get(Events);

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

			this.events.on(Events.MEMORY_UPDATE).subscribe((event) => {
				const changes: MemoryUpdate = event.data[0];
				const newScene = changes.CurrentScene;
				this.updateScene(newScene);
			});
		});
	}

	private updateScene(scene: SceneMode) {
		if (!scene) {
			return;
		}

		this.currentScene$$.next(scene);
		if (scene !== SceneMode.GAMEPLAY) {
			this.lastNonGamePlayScene$$.next(scene);
		} else if (this.lastNonGamePlayScene$$.value === null) {
			this.lastNonGamePlayScene$$.next(undefined);
		}
	}
}
