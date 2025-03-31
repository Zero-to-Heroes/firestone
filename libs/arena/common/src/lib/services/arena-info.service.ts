import { Injectable } from '@angular/core';
import { SceneMode } from '@firestone-hs/reference-data';
import { ArenaInfo, MemoryInspectionService, SceneService } from '@firestone/memory';
import { sleep } from '@firestone/shared/framework/common';
import { BehaviorSubject, filter } from 'rxjs';

@Injectable()
export class ArenaInfoService {
	public arenaInfo$$ = new BehaviorSubject<ArenaInfo | null>(null);

	constructor(private readonly memory: MemoryInspectionService, private readonly scene: SceneService) {
		this.init();
	}

	private async init() {
		await this.scene.isReady();

		this.scene.currentScene$$
			.pipe(filter((scene) => scene === SceneMode.DRAFT))
			.subscribe(() => this.triggerArenaInfoRetrieve(false));
	}

	public async forceRetrieveArenaInfo(): Promise<ArenaInfo | null> {
		console.log('[arena-info] force retrieving arena info', this.arenaInfo$$.value);
		if (this.arenaInfo$$.value) {
			return this.arenaInfo$$.value;
		}
		return await this.memory.getArenaInfo();
	}

	public async triggerArenaInfoRetrieve(spectating: boolean) {
		if (spectating) {
			return;
		}
		await runLoop(async () => {
			const arenaInfo = await this.memory.getArenaInfo();
			console.log('[arena-info] retrieved arena info', arenaInfo);
			if (arenaInfo?.losses != null && arenaInfo?.wins != null) {
				this.arenaInfo$$.next(arenaInfo);
				return true;
			}
			return false;
		}, 'arenaInfo');
	}
}

const runLoop = async (coreLoop: () => Promise<boolean>, type: string) => {
	let retriesLeft = 20;
	while (retriesLeft > 0) {
		if (await coreLoop()) {
			return;
		}
		await sleep(3000);
		retriesLeft--;
	}
	console.warn('[match-info] could not retrieve ', type);
};
