import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsPanelId } from '../../../../models/battlegrounds/bgs-panel-id.type';
import { BgsStageId } from '../../../../models/battlegrounds/bgs-stage-id.type';
import { BgsStageChangeEvent } from '../events/bgs-stage-change-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsStageChangeParser implements EventParser {
	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsStageChangeEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsStageChangeEvent): Promise<BattlegroundsState> {
		const panelId: BgsPanelId = this.buildDefaultPanelId(event.stage);
		return currentState.update({
			currentStageId: event.stage,
			currentPanelId: panelId,
		} as BattlegroundsState);
	}

	private buildDefaultPanelId(stage: BgsStageId): BgsPanelId {
		switch (stage) {
			case 'hero-selection':
				return 'bgs-hero-selection-overview';
			case 'in-game':
				return 'bgs-next-opponent-overview';
			case 'post-match':
				return 'bgs-post-match-stats';
		}
	}
}
