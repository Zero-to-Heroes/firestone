import { GameTag, Step } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider } from '../game-event';
import { Node, NodeType, TagChange } from '../models';
import { Utility } from '../utility';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class MainStepReadyParser implements ActionParser {
	readonly ParserName = 'MainStepReadyParser';

	private GameState: GameState;
	private ParserState: ParserState;

	constructor(parserState: ParserState, _stateFacade: StateFacade) {
		this.ParserState = parserState;
		this.GameState = parserState.GameState;
	}

	AppliesOnNewNode(node: Node, stateType: StateType): boolean {
		return (
			stateType === StateType.PowerTaskList &&
			node.Type === NodeType.TagChange &&
			(node.Object as TagChange).Name === (GameTag.STEP as number) &&
			(node.Object as TagChange).Value === (Step.MAIN_READY as number)
		);
	}

	AppliesOnCloseNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const tagChange = node.Object as TagChange;
		const timestamp = Utility.GetUtcTimestamp(tagChange.TimeStamp);
		return [
			GameEventProvider.Create(
				tagChange.TimeStamp,
				'MAIN_STEP_READY',
				() => ({
					Type: 'MAIN_STEP_READY',
					Value: {
						Timestamp: timestamp,
					},
				}),
				false,
				node,
			),
		];
	}

	CreateGameEventProviderFromClose(_node: Node): GameEventProvider[] | null {
		return null;
	}
}
