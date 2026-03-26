import { BlockType, CardIds, GameTag } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider } from '../game-event';
import { Action, Node, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class BattlegroundFreezeParser implements ActionParser {
	readonly ParserName = 'BattlegroundFreezeParser';

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
			node.Type === Action &&
			(node.Object as Action).Type === (BlockType.POWER as number) &&
			this.GameState.CurrentEntities.has((node.Object as Action).Entity) &&
			this.GameState.CurrentEntities.get((node.Object as Action).Entity)!.CardId ===
				CardIds.Freeze_TB_BaconShopLockAll_Button
		);
	}

	CreateGameEventProviderFromNew(_node: Node): GameEventProvider[] | null {
		return null;
	}

	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null {
		const action = node.Object as Action;
		const frozenCount = action.Data.filter((data) => data instanceof TagChange)
			.map((data) => data as unknown as TagChange)
			.filter((tag) => tag.Name === (GameTag.FROZEN as number)).length;
		if (frozenCount === 0) {
			return null;
		}

		return [
			GameEventProvider.Create(
				(node.Object as Action).TimeStamp,
				'BATTLEGROUNDS_FREEZE',
				() => ({
					Type: 'BATTLEGROUNDS_FREEZE',
					Value: {},
				}),
				true,
				node,
			),
		];
	}
}
