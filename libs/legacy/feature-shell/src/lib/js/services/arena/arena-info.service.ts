import { Injectable } from '@angular/core';
import { SceneMode } from '@firestone-hs/reference-data';
import { BehaviorSubject, filter } from 'rxjs';
import { ArenaInfo } from '../../models/arena-info';
import { runLoop } from '../game-mode-data.service';
import { SceneService } from '../game/scene.service';
import { MemoryInspectionService } from '../plugins/memory-inspection.service';

@Injectable()
export class ArenaInfoService {
	public arenaInfo$$ = new BehaviorSubject<ArenaInfo>(null);

	constructor(private readonly memory: MemoryInspectionService, private readonly scene: SceneService) {
		this.init();
	}

	private async init() {
		await this.scene.isReady();

		this.scene.currentScene$$
			.pipe(filter((scene) => scene === SceneMode.DRAFT))
			.subscribe(() => this.triggerArenaInfoRetrieve(false));
	}

	public async triggerArenaInfoRetrieve(spectating: boolean) {
		if (spectating) {
			return;
		}
		await runLoop(async () => {
			const arenaInfo = await this.memory.getArenaInfo();
			if (arenaInfo?.losses != null && arenaInfo?.wins != null) {
				console.debug('[arena-info] retrieved arena info', arenaInfo);
				this.arenaInfo$$.next(arenaInfo);
				return true;
			}
			return false;
		}, 'arenaInfo');
	}
}
