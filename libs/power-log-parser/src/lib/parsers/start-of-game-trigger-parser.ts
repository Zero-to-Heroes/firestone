import { BlockType, CardIds, GameTag } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventHelper, GameEventProvider } from '../game-event';
import { Action, Node, NodeType } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

const FORCE_START_OF_GAME_POWERS: string[] = [CardIds.PrinceRenathal, CardIds.PrinceRenathal_CORE_REV_018];

export class StartOfGameTriggerParser implements ActionParser {
	readonly ParserName = 'StartOfGameTriggerParser';

	private GameState: GameState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, stateFacade: StateFacade) {
		this.GameState = parserState.GameState;
		this.StateFacade = stateFacade;
	}

	AppliesOnNewNode(node: Node, stateType: StateType): boolean {
		let action: Action | null = null;
		return (
			stateType === StateType.PowerTaskList &&
			node.Type === NodeType.Action &&
			(action = node.Object as Action).Type === (BlockType.TRIGGER as number) &&
			(action.TriggerKeyword === (GameTag.START_OF_GAME_KEYWORD as number) ||
				action.TriggerKeyword === (GameTag.TAG_NOT_SET as number))
		);
	}

	AppliesOnCloseNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const action = node.Object as Action;
		const actionEntity = this.GameState.CurrentEntities.get(action.Entity);
		if (
			action.TriggerKeyword === (GameTag.TAG_NOT_SET as number) &&
			!FORCE_START_OF_GAME_POWERS.includes(actionEntity?.CardId ?? '')
		) {
			return null;
		}

		const controllerId = actionEntity?.GetTag(GameTag.CONTROLLER) ?? -1;
		return [
			GameEventProvider.Create(
				action.TimeStamp,
				'START_OF_GAME',
				GameEventHelper.CreateProvider(
					'START_OF_GAME',
					actionEntity?.CardId ?? '',
					controllerId,
					action.Entity,
					this.StateFacade,
				),
				true,
				node,
			),
		];
	}

	CreateGameEventProviderFromClose(_node: Node): GameEventProvider[] | null {
		return null;
	}
}
