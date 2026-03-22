import { GameTag } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventHelper, GameEventProvider } from '../game-event';
import { Node, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class OverloadedCrystalsParser implements ActionParser {
	readonly ParserName = 'OverloadedCrystalsParser';

	private GameState: GameState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, stateFacade: StateFacade) {
		this.GameState = parserState.GameState;
		this.StateFacade = stateFacade;
	}

	AppliesOnNewNode(node: Node, stateType: StateType): boolean {
		let tagChange: TagChange | null = null;
		return (
			stateType === StateType.PowerTaskList &&
			node.Type === TagChange &&
			((tagChange = node.Object as TagChange).Name === (GameTag.OVERLOAD_LOCKED as number) ||
				tagChange.Name === (GameTag.OVERLOAD_OWED as number))
		);
	}

	AppliesOnCloseNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const tagChange = node.Object as TagChange;
		const entity = this.GameState.CurrentEntities.get(tagChange.Entity);
		if (entity == null) {
			return null;
		}

		const overloaded =
			tagChange.Name === (GameTag.OVERLOAD_LOCKED as number)
				? tagChange.Value + entity.GetTag(GameTag.OVERLOAD_OWED, 0)
				: tagChange.Value + entity.GetTag(GameTag.OVERLOAD_LOCKED, 0);
		const cardId = entity.CardId;
		const controllerId = entity.GetEffectiveController();
		return [
			GameEventProvider.Create(
				tagChange.TimeStamp,
				'OVERLOADED_CRYSTALS_CHANGED',
				GameEventHelper.CreateProvider('OVERLOADED_CRYSTALS_CHANGED', cardId, controllerId, entity.Id, this.StateFacade, {
					Overload: overloaded,
				}),
				true,
				node,
			),
		];
	}

	CreateGameEventProviderFromClose(_node: Node): GameEventProvider[] | null {
		return null;
	}
}
