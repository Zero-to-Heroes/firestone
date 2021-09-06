import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsPanel } from '../../../../models/battlegrounds/bgs-panel';
import { BgsBattlesPanel } from '../../../../models/battlegrounds/in-game/bgs-battles-panel';
import { BgsSelectBattleEvent } from '../events/bgs-select-battle-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsSelectBattleParser implements EventParser {
	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsSelectBattleEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsSelectBattleEvent): Promise<BattlegroundsState> {
		const panel: BgsBattlesPanel = currentState.panels.find(
			(p: BgsPanel) => p.id === 'bgs-battles',
		) as BgsBattlesPanel;
		const newPanel = panel.update({
			selectedFaceOffId: event.faceOffId,
			closedManually: event.faceOffId == null,
		} as BgsBattlesPanel);
		return currentState.updatePanel(newPanel);
	}
}
