import { CardType, GameTag } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventHelper, GameEventProvider } from '../game-event';
import { Node, NodeType, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class DataScriptChangedParser implements ActionParser {
	readonly ParserName = 'DataScriptChangedParser';

	private GameState: GameState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, stateFacade: StateFacade) {
		this.GameState = parserState.GameState;
		this.StateFacade = stateFacade;
	}

	AppliesOnNewNode(node: Node, stateType: StateType): boolean {
		return (
			stateType === StateType.PowerTaskList &&
			node.Type === NodeType.TagChange &&
			((node.Object as TagChange).Name === (GameTag.TAG_SCRIPT_DATA_NUM_1 as number) ||
				(node.Object as TagChange).Name === (GameTag.TAG_SCRIPT_DATA_NUM_2 as number))
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

		if (this.StateFacade.IsBattlegrounds() && entity.GetCardType() !== (CardType.ENCHANTMENT as number)) {
			return null;
		}

		const initialData1 = entity.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_1, 0);
		const initialData2 = entity.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_2, 0);
		let newData1 = initialData1;
		let newData2 = initialData2;
		if (tagChange.Name === (GameTag.TAG_SCRIPT_DATA_NUM_1 as number)) {
			newData1 = tagChange.Value;
		}
		if (tagChange.Name === (GameTag.TAG_SCRIPT_DATA_NUM_2 as number)) {
			newData2 = tagChange.Value;
		}
		if (initialData1 === newData1 && initialData2 === newData2) {
			return null;
		}

		const cardId = entity.CardId;
		const controllerId = entity.GetEffectiveController();
		return [
			GameEventProvider.Create(
				tagChange.TimeStamp,
				'DATA_SCRIPT_CHANGED',
				GameEventHelper.CreateProvider('DATA_SCRIPT_CHANGED', cardId, controllerId, entity.Id, this.StateFacade, {
					DataNum1: newData1,
					DataNum2: newData2,
					Updates: [{ CardId: cardId, EntityId: entity.Id, ControllerId: controllerId, DataNum1: newData1, DataNum2: newData2 }],
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
