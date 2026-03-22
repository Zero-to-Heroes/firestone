import { GameTag } from '@firestone-hs/reference-data';
import { AbstractBasicTagChangeParser } from './abstract-basic-tag-change-parser';
import { ParserState } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class CorpsesSpentThisGameParser extends AbstractBasicTagChangeParser {
	readonly ParserName = 'CorpsesSpentThisGameParser';

	constructor(parserState: ParserState, facade: StateFacade) {
		super(parserState, facade, GameTag.CORPSES_SPENT_THIS_GAME, 'CORPSES_SPENT_THIS_GAME_CHANGED');
	}
}
