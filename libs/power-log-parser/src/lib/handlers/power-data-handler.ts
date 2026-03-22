import type { Helper } from '../helper';
import { Regexes } from '../regexes';
import type { ParserState } from '../state/parser-state';

export class PowerDataHandler {
	private helper: Helper;

	constructor(helper: Helper) {
		this.helper = helper;
	}

	Handle(timestamp: string, data: string, state: ParserState): void {
		if (data.includes('BLOCK_START')) {
			const match = Regexes.ActionStartRegex.exec(data);
			if (match) {
				const rawEntity = match[2];
				state.GameState.UpdateEntityName(rawEntity);
				return;
			}
		}

		if (data.includes('FULL_ENTITY')) {
			let match = Regexes.ActionFullEntityUpdatingRegex.exec(data);
			if (!match) {
				match = Regexes.ActionFullEntityCreatingRegex.exec(data);
			}
			if (match) {
				const rawEntity = match[1];
				state.GameState.UpdateEntityName(rawEntity);
				return;
			}
		}

		if (data.includes('TAG_CHANGE')) {
			const match = Regexes.ActionTagChangeRegex.exec(data);
			if (match) {
				const rawEntity = match[1];
				state.GameState.UpdateEntityName(rawEntity);
				return;
			}
		}
	}
}
