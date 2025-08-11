import { Injectable } from '@angular/core';
import { SceneMode } from '@firestone-hs/reference-data';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { AbstractFacadeService, AppInjector, WindowManagerService } from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';
import { MemoryInspectionService } from './memory-inspection.service';
import { MemoryUpdatesService } from './memory-updates.service';

const eventName = 'scene-changed';
const eventNameLastNonGamePlayScene = 'last-non-game-play-scene-changed';

@Injectable()
export class SceneService extends AbstractFacadeService<SceneService> {
	public currentScene$$: BehaviorSubject<SceneMode | null>;
	public lastNonGamePlayScene$$: BehaviorSubject<SceneMode | null | undefined>;

	private memory: MemoryInspectionService;
	private memoryUpdates: MemoryUpdatesService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'sceneService', () => !!this.currentScene$$ && !!this.lastNonGamePlayScene$$);
	}

	protected override assignSubjects() {
		this.currentScene$$ = this.mainInstance.currentScene$$;
		this.lastNonGamePlayScene$$ = this.mainInstance.lastNonGamePlayScene$$;
	}

	protected async init() {
		this.currentScene$$ = new BehaviorSubject<SceneMode | null>(null);
		this.lastNonGamePlayScene$$ = new BehaviorSubject<SceneMode | null | undefined>(null);
		this.memory = AppInjector.get(MemoryInspectionService);
		this.memoryUpdates = AppInjector.get(MemoryUpdatesService);
		console.log('[scene-service] ready');

		this.memoryUpdates.memoryUpdates$$.subscribe((changes) => {
			// console.debug('[scene-service] memory updates', changes, changes.CurrentScene);
			const newScene = changes.CurrentScene;
			this.updateScene(newScene);
		});

		const scene = await this.memory.getCurrentSceneFromMindVision();
		console.debug('[scene-service] got initial scene', scene);
		this.updateScene(scene);
	}

	private updateScene(scene: SceneMode | null) {
		if (!scene) {
			return;
		}

		console.debug('[scene-service] new scene', SceneMode[scene]);
		this.currentScene$$.next(scene);
		if (scene !== SceneMode.GAMEPLAY) {
			this.lastNonGamePlayScene$$.next(scene);
		}
		if (this.lastNonGamePlayScene$$.value === null) {
			this.lastNonGamePlayScene$$.next(undefined);
		}
	}

	protected override async initElectronSubjects() {
		this.setupElectronSubject(this.currentScene$$, eventName);
		this.setupElectronSubject(this.lastNonGamePlayScene$$, eventNameLastNonGamePlayScene);
	}

	// In renderer process
	protected override async createElectronProxy(ipcRenderer: any) {
		// In renderer process, create proxy subjects that communicate with main process via IPC
		this.currentScene$$ = new SubscriberAwareBehaviorSubject<SceneMode | null>(null);
		this.lastNonGamePlayScene$$ = new SubscriberAwareBehaviorSubject<SceneMode | null | undefined>(null);
	}
}
