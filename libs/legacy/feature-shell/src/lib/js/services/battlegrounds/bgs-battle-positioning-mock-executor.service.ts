import { Injectable } from '@angular/core';
import { BgsBattleInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-battle-info';
import { PermutationResult, ProcessingStatus } from './bgs-battle-positioning-executor.service';

@Injectable()
export class BgsBattlePositioningMockExecutorService {
	public findBestPositioning(battleInfo: BgsBattleInfo): AsyncIterator<[ProcessingStatus, PermutationResult]> {
		return null;
	}
	public cancel(): void {
		return;
	}
}
