import { Injectable } from '@angular/core';
import { BgsBattleInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-battle-info';
import {
	BgsBattlePositioningExecutorService,
	PermutationResult,
	ProcessingStatus,
} from './bgs-battle-positioning-executor.service';

@Injectable()
export class BgsBattlePositioningService {
	constructor(private readonly executor: BgsBattlePositioningExecutorService) {}

	public findBestPositioning(battleInfo: BgsBattleInfo): AsyncIterator<[ProcessingStatus, PermutationResult]> {
		return this.executor.findBestPositioning(battleInfo);
	}

	public cancel() {
		this.executor.cancel();
	}
}
