import { BlockType } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventHelper, GameEventProvider } from '../game-event';
import { Action, Node, NodeType } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class PowerTriggeredParser implements ActionParser {
	readonly ParserName = 'PowerTriggeredParser';

	private GameState: GameState;
	private ParserState: ParserState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, stateFacade: StateFacade) {
		this.ParserState = parserState;
		this.GameState = parserState.GameState;
		this.StateFacade = stateFacade;
	}

	AppliesOnNewNode(node: Node, stateType: StateType): boolean {
		if (stateType !== StateType.PowerTaskList) {
			return false;
		}
		return node.Type === NodeType.Action && (node.Object as Action).Type === (BlockType.POWER as number);
	}

	AppliesOnCloseNode(node: Node, stateType: StateType): boolean {
		if (stateType !== StateType.PowerTaskList) {
			return false;
		}
		return node.Type === NodeType.Action && (node.Object as Action).Type === (BlockType.POWER as number);
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const action = node.Object as Action;
		const entity = this.GameState.CurrentEntities.get(action.Entity)!;
		const cardId = entity.CardId;
		const controllerId = entity.GetEffectiveController();
		return [
			GameEventProvider.Create(
				action.TimeStamp,
				'POWER_TRIGGERED',
				GameEventHelper.CreateProvider('POWER_TRIGGERED', cardId, controllerId, entity.Id, this.StateFacade),
				true,
				node,
			),
		];
	}

	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null {
		const action = node.Object as Action;
		const entity = this.GameState.CurrentEntities.get(action.Entity)!;
		const cardId = entity.CardId;
		const controllerId = entity.GetEffectiveController();
		const data = action.Data;
		const lastData = data[data.length - 1];
		// So that it correctly shows up after all the elements of the action
		const timestamp = lastData?.TimeStamp ?? action.TimeStamp;
		// All the elements can have the same timestamp, and by default we use the node's index - meaning the opening action
		// tag
		// We need to find the index of the last processed element instead
		const index = Node.currentIndex++;

		return [
			GameEventProvider.Create(
				timestamp,
				'POWER_TRIGGERED_END',
				GameEventHelper.CreateProvider(
					'POWER_TRIGGERED_END',
					cardId,
					controllerId,
					entity.Id,
					this.StateFacade,
				),
				true,
				node,
				{ forceIndex: index },
			),
		];
	}
}
