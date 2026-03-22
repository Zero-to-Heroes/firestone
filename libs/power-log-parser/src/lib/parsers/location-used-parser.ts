import { BlockType, CardType, GameTag } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventHelper, GameEventProvider } from '../game-event';
import { Action, Node, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class LocationUsedParser implements ActionParser {
	readonly ParserName = 'LocationUsedParser';

	private GameState: GameState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, stateFacade: StateFacade) {
		this.GameState = parserState.GameState;
		this.StateFacade = stateFacade;
	}

	AppliesOnNewNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	AppliesOnCloseNode(node: Node, stateType: StateType): boolean {
		let action: Action | null = null;
		return (
			stateType === StateType.PowerTaskList &&
			node.Type === Action &&
			(action = node.Object as Action).Type === (BlockType.POWER as number) &&
			this.GameState.CurrentEntities.get(action.Entity)?.GetCardType() === (CardType.LOCATION as number)
		);
	}

	CreateGameEventProviderFromNew(_node: Node): GameEventProvider[] | null {
		return null;
	}

	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null {
		const action = node.Object as Action;
		const hasLocationCooldown =
			action.Data.filter((d): d is TagChange => d instanceof TagChange).some(
				(d) => d.Name === (GameTag.LOCATION_ACTION_COOLDOWN as number) && d.Entity === action.Entity,
			);
		if (!hasLocationCooldown) {
			return null;
		}
		const entity = this.GameState.CurrentEntities.get(action.Entity)!;
		const cardId = entity.CardId;
		const controllerId = entity.GetEffectiveController();
		return [
			GameEventProvider.Create(
				action.TimeStamp,
				'LOCATION_USED',
				GameEventHelper.CreateProvider('LOCATION_USED', cardId, controllerId, entity.Id, this.StateFacade),
				true,
				node,
			),
		];
	}
}
