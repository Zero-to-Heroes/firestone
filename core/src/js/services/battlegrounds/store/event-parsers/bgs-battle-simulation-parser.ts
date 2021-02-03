import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsGame } from '../../../../models/battlegrounds/bgs-game';
import { PreferencesService } from '../../../preferences.service';
import { BattlegroundsBattleSimulationEvent } from '../events/battlegrounds-battle-simulation-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsBattleSimulationParser implements EventParser {
	constructor(private readonly prefs: PreferencesService) {}

	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BattlegroundsBattleSimulationEvent';
	}

	public async parse(
		currentState: BattlegroundsState,
		event: BattlegroundsBattleSimulationEvent,
	): Promise<BattlegroundsState> {
		const prefs = await this.prefs.getPreferences();
		const showSimulation = !prefs.bgsShowSimResultsOnlyOnRecruit;
		console.debug('[bgs-simulation-parser] setting battle result', event.result.damageWon, showSimulation);
		return currentState.update({
			currentGame: currentState.currentGame.update({
				battleResult: event.result,
				battleInfoStatus: showSimulation ? 'done' : 'empty',
			} as BgsGame),
		} as BattlegroundsState);
	}
}
