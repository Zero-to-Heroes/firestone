import { GameTag, Step } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider } from '../game-event';
import { Node, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class TurnCleanupParser implements ActionParser {
	readonly ParserName = 'TurnCleanupParser';

	private GameState: GameState;
	private ParserState: ParserState;

	constructor(parserState: ParserState, _stateFacade: StateFacade) {
		this.ParserState = parserState;
		this.GameState = parserState.GameState;
	}

	AppliesOnNewNode(node: Node, stateType: StateType): boolean {
		if (stateType !== StateType.GameState || node.Type !== TagChange) return false;
		const tc = node.Object as TagChange;
		const isNormalTurnChange =
			!this.ParserState.IsMercenaries() &&
			tc.Name === (GameTag.TURN as number) &&
			this.GameState.GetGameEntity()?.Entity === tc.Entity;
		const isMercenariesTurnChange =
			this.ParserState.IsMercenaries() &&
			tc.Name === (GameTag.STEP as number) &&
			tc.Value === (Step.MAIN_PRE_ACTION as number) &&
			this.GameState.GetGameEntity()?.Entity === tc.Entity;
		return isNormalTurnChange || isMercenariesTurnChange;
	}

	AppliesOnCloseNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const tc = node.Object as TagChange;
		const newTurnValue = tc.Name === (GameTag.TURN as number) ? tc.Value : this.GameState.CurrentTurn + 1;
		this.GameState.CurrentTurn = newTurnValue;
		this.GameState.OnNewTurn();
		return null;
	}

	CreateGameEventProviderFromClose(_node: Node): GameEventProvider[] | null {
		return null;
	}
}
