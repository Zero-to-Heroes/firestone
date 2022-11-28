import { Injectable } from '@angular/core';
import { BgsBattleInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-battle-info';
import { SimulationResult } from '@firestone-hs/simulate-bgs-battle/dist/simulation-result';

@Injectable()
export abstract class BgsBattlePositioningExecutorService {
	public abstract findBestPositioning(
		battleInfo: BgsBattleInfo,
	): AsyncIterator<[ProcessingStatus, PermutationResult]>;
	public abstract cancel(): void;
}

export interface PermutationResult {
	readonly battleInfo: BgsBattleInfo;
	readonly result: SimulationResult;
}

export enum ProcessingStatus {
	FIRSTPASS,
	SECONDPASS,
	FINALRESULT,
	DONE,
	CANCELLED,
}
