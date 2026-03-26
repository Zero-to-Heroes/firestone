import { GameTag } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventHelper, GameEventProvider } from '../game-event';
import { ChangeEntity, Node, NodeType } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class BattlegroundsHeroRerollParser implements ActionParser {
	readonly ParserName = 'BattlegroundsHeroRerollParser';

	private GameState: GameState;
	private ParserState: ParserState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, helper: StateFacade) {
		this.ParserState = parserState;
		this.GameState = parserState.GameState;
		this.StateFacade = helper;
	}

	AppliesOnNewNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	AppliesOnCloseNode(node: Node, stateType: StateType): boolean {
		return (
			stateType === StateType.PowerTaskList &&
			this.StateFacade.IsBattlegrounds() &&
			node.Type === NodeType.ChangeEntity &&
			(node.Object as ChangeEntity).GetTag(GameTag.BACON_NUM_MULLIGAN_REFRESH_USED) > 0
		);
	}

	CreateGameEventProviderFromNew(_node: Node): GameEventProvider[] | null {
		return null;
	}

	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null {
		const changeEntity = node.Object as ChangeEntity;
		return [
			GameEventProvider.Create(
				changeEntity.TimeStamp,
				'BATTLEGROUNDS_HERO_REROLL',
				GameEventHelper.CreateProvider(
					'BATTLEGROUNDS_HERO_REROLL',
					changeEntity.CardId,
					-1,
					changeEntity.Entity,
					this.StateFacade,
					null,
				),
				true,
				node,
			),
		];
	}
}
