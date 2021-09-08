import { Injectable } from '@angular/core';
import { CardsFacadeService } from '@services/cards-facade.service';
import { PreferencesService } from '../preferences.service';

@Injectable()
export class BgsBuilderService {
	constructor(private readonly cards: CardsFacadeService, private readonly prefs: PreferencesService) {}

	// public async updateStats(
	// 	currentState: BattlegroundsAppState,
	// 	currentBattlegroundsMetaPatch: PatchInfo,
	// ): Promise<BattlegroundsAppState> {
	// 	if (!currentState.globalStats) {
	// 		console.warn('Did not retrieve global stats');
	// 		return currentState;
	// 	}
	// 	return currentState.update({
	// 		currentBattlegroundsMetaPatch: currentBattlegroundsMetaPatch,
	// 	} as BattlegroundsAppState);
	// }
}
