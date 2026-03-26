import { BlockType, CardIds } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider } from '../game-event';
import { Action, FullEntity, Node, NodeType } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class BattlegroundsRerollParser implements ActionParser {
	readonly ParserName = 'BattlegroundsRerollParser';

	private GameState: GameState;
	private ParserState: ParserState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, stateFacade: StateFacade) {
		this.ParserState = parserState;
		this.GameState = parserState.GameState;
		this.StateFacade = stateFacade;
	}

	AppliesOnNewNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	AppliesOnCloseNode(node: Node, stateType: StateType): boolean {
		return (
			stateType === StateType.PowerTaskList &&
			this.StateFacade.IsBattlegrounds() &&
			node.Type === NodeType.Action &&
			(node.Object as Action).Type === (BlockType.POWER as number) &&
			this.GameState.CurrentEntities.has((node.Object as Action).Entity) &&
			(this.GameState.CurrentEntities.get((node.Object as Action).Entity)!.CardId ===
				CardIds.Refresh_TB_BaconShop_1p_Reroll_Button ||
				this.GameState.CurrentEntities.get((node.Object as Action).Entity)!.CardId ===
					CardIds.Refresh_TB_BaconShop_8p_Reroll_Button)
		);
	}

	CreateGameEventProviderFromNew(_node: Node): GameEventProvider[] | null {
		return null;
	}

	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null {
		const action = node.Object as Action;
		const fullEntities = action.Data.filter((data) => data instanceof FullEntity);
		if (fullEntities.length === 0) {
			return null;
		}

		return [
			GameEventProvider.Create(
				(node.Object as Action).TimeStamp,
				'BATTLEGROUNDS_REROLL',
				() => ({
					Type: 'BATTLEGROUNDS_REROLL',
					Value: {},
				}),
				true,
				node,
			),
		];
	}
}
