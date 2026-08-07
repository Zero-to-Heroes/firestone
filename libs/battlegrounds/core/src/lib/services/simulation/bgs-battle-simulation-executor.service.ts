import { Injectable } from '@angular/core';
import { BgsBattleInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-battle-info';
import { SimulationResult } from '@firestone-hs/simulate-bgs-battle/dist/simulation-result';
import { Preferences } from '@firestone/shared/common/service';

@Injectable()
export abstract class BgsBattleSimulationExecutorService {
	public abstract simulateLocalBattle(
		battleInfo: BgsBattleInfo,
		prefs: Preferences,
		includeOutcomeSamples: boolean,
		onResultReceived: (result: SimulationResult | null) => void,
	): void;

	/** Spawn/init the compute worker early so fight 1 does not pay cards structured-clone. */
	public ensureWorkerReady(): void {
		// Optional; mock / remote executors no-op
	}
}
