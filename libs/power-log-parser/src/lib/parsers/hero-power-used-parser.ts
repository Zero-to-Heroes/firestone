import { BlockType, CardType, GameTag } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider, GameEventHelper } from '../game-event';
import { Action, Node } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class HeroPowerUsedParser implements ActionParser {
	readonly ParserName = 'HeroPowerUsedParser';

	private GameState: GameState;
	private ParserState: ParserState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, facade: StateFacade) {
		this.ParserState = parserState;
		this.GameState = parserState.GameState;
		this.StateFacade = facade;
	}

	AppliesOnNewNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	AppliesOnCloseNode(node: Node, stateType: StateType): boolean {
		return (
			stateType === StateType.PowerTaskList &&
			node.Type === Action &&
			(node.Object as Action).Type === (BlockType.POWER as number)
		);
	}

	CreateGameEventProviderFromNew(_node: Node): GameEventProvider[] | null {
		return null;
	}

	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null {
		const action = node.Object as Action;
		if (!this.GameState.CurrentEntities.has(action.Entity)) {
			return null;
		}

		const entity = this.GameState.CurrentEntities.get(action.Entity)!;
		if (entity.GetTag(GameTag.CARDTYPE) !== (CardType.HERO_POWER as number)) {
			return null;
		}

		if (action.EffectIndex !== 0) {
			return null;
		}

		const cardId = entity.CardId;
		const controllerId = entity.GetEffectiveController();
		return [
			GameEventProvider.Create(
				action.TimeStamp,
				'HERO_POWER_USED',
				GameEventHelper.CreateProvider('HERO_POWER_USED', cardId, controllerId, entity.Id, this.StateFacade),
				true,
				node,
			),
		];
	}
}
