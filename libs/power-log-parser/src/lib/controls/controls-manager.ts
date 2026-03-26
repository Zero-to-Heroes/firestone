import type { ActionParser } from '../action-parser';
import type { StateFacade } from '../state/state-facade';
import { StateType } from '../state/parser-state';
import { BG_EXCLUDED_PARSERS } from './battlegrounds-controls';

export class ControlsManager {
	private stateFacade: StateFacade;
	private stateType: StateType;

	constructor(stateFacade: StateFacade, stateType: StateType) {
		this.stateFacade = stateFacade;
		this.stateType = stateType;
	}

	Applies(parser: ActionParser): boolean {
		if (this.stateFacade.IsBattlegrounds()) {
			if (BG_EXCLUDED_PARSERS.has(parser.ParserName)) {
				return false;
			}
		}
		return true;
	}
}
