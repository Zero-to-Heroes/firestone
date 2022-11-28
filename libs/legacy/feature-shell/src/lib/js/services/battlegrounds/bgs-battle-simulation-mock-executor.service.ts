import { Injectable } from '@angular/core';
import { BgsBattleInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-battle-info';
import { SimulationResult } from '@firestone-hs/simulate-bgs-battle/dist/simulation-result';
import { Preferences } from '../../models/preferences';
import { BgsBattleSimulationExecutorService } from './bgs-battle-simulation-executor.service';

@Injectable()
export class BgsBattleSimulationMockExecutorService extends BgsBattleSimulationExecutorService {
	public async simulateLocalBattle(battleInfo: BgsBattleInfo, prefs: Preferences): Promise<SimulationResult> {
		return null;
	}
}
