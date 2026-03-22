import { BlockType, CardIds } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventHelper, GameEventProvider } from '../game-event';
import { Action, Node } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class MindrenderIlluciaParser implements ActionParser {
	readonly ParserName = 'MindrenderIlluciaParser';

	private GameState: GameState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, stateFacade: StateFacade) {
		this.GameState = parserState.GameState;
		this.StateFacade = stateFacade;
	}

	AppliesOnNewNode(node: Node, stateType: StateType): boolean {
		return (
			stateType === StateType.PowerTaskList &&
			node.Type === Action &&
			(node.Object as Action).Type === (BlockType.POWER as number) &&
			this.GameState.CurrentEntities.has((node.Object as Action).Entity) &&
			this.GameState.CurrentEntities.get((node.Object as Action).Entity)!.CardId === CardIds.MindrenderIllucia
		);
	}

	AppliesOnCloseNode(node: Node, stateType: StateType): boolean {
		return (
			stateType === StateType.PowerTaskList &&
			node.Type === Action &&
			(node.Object as Action).Type === (BlockType.TRIGGER as number) &&
			this.GameState.CurrentEntities.has((node.Object as Action).Entity) &&
			this.GameState.CurrentEntities.get((node.Object as Action).Entity)!.CardId ===
				CardIds.MindrenderIllucia_MindSwapEnchantment
		);
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const action = node.Object as Action;
		return [
			GameEventProvider.Create(
				action.TimeStamp,
				'MINDRENDER_ILLUCIA_START',
				GameEventHelper.CreateProvider('MINDRENDER_ILLUCIA_START', null as any, -1, -1, this.StateFacade),
				true,
				node,
			),
		];
	}

	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null {
		const action = node.Object as Action;
		return [
			GameEventProvider.Create(
				action.TimeStamp,
				'MINDRENDER_ILLUCIA_END',
				GameEventHelper.CreateProvider('MINDRENDER_ILLUCIA_END', null as any, -1, -1, this.StateFacade),
				true,
				node,
			),
		];
	}

	static IsProcessingMindrenderIlluciaEffect(node: Node, gameState: GameState): boolean {
		if (node.Parent == null || node.Parent.Type !== Action) {
			return false;
		}

		const parentAction = node.Parent.Object as Action;
		return (
			(parentAction.Type === (BlockType.POWER as number) &&
				gameState.CurrentEntities.has(parentAction.Entity) &&
				gameState.CurrentEntities.get(parentAction.Entity)!.CardId === CardIds.MindrenderIllucia) ||
			(parentAction.Type === (BlockType.TRIGGER as number) &&
				gameState.CurrentEntities.has(parentAction.Entity) &&
				gameState.CurrentEntities.get(parentAction.Entity)!.CardId ===
					CardIds.MindrenderIllucia_MindSwapEnchantment)
		);
	}
}
