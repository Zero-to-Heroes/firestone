import { BattlegroundsState, BgsBattlesPanel, BgsFaceOffWithSimulation, BgsPanel } from '@firestone/battlegrounds/core';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { BgsBattleSimulationResetEvent } from '../events/bgs-battle-simulation-reset-event';
import { EventParser } from './_event-parser';

export class BgsBattleSimulationResetParser implements EventParser {
	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsBattleSimulationResetEvent';
	}

	public async parse(
		currentState: BattlegroundsState,
		event: BgsBattleSimulationResetEvent,
	): Promise<BattlegroundsState> {
		const panel: BgsBattlesPanel = currentState.panels.find(
			(p: BgsPanel) => p.id === 'bgs-battles',
		) as BgsBattlesPanel;
		const newPanel = panel.update({
			currentSimulations: panel.currentSimulations.filter(
				(faceOff) => faceOff.id !== event.faceOffId,
			) as readonly BgsFaceOffWithSimulation[],
		} as BgsBattlesPanel);
		return currentState.updatePanel(newPanel);
	}
}
