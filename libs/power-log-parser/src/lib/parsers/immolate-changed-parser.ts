import { GameTag } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventHelper, GameEventProvider } from '../game-event';
import { Node, NodeType, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class ImmolateChangedParser implements ActionParser {
	readonly ParserName = 'ImmolateChangedParser';

	private GameState: GameState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, stateFacade: StateFacade) {
		this.GameState = parserState.GameState;
		this.StateFacade = stateFacade;
	}

	AppliesOnNewNode(node: Node, stateType: StateType): boolean {
		if (this.StateFacade.IsBattlegrounds()) {
			return false;
		}
		return (
			stateType === StateType.PowerTaskList &&
			node.Type === NodeType.TagChange &&
			((node.Object as TagChange).Name === (GameTag.IMMOLATESTAGE as number) ||
				(node.Object as TagChange).Name === (GameTag.IMMOLATING as number))
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

		const initialData1 = entity.GetTag(GameTag.IMMOLATESTAGE, 0);
		const initialData2 = entity.GetTag(GameTag.IMMOLATING, 0);
		let newData1 = initialData1;
		let newData2 = initialData2;
		if (tagChange.Name === (GameTag.IMMOLATESTAGE as number)) {
			newData1 = tagChange.Value;
		}
		if (tagChange.Name === (GameTag.IMMOLATING as number)) {
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
				'IMMOLATE_CHANGED',
				GameEventHelper.CreateProvider('IMMOLATE_CHANGED', cardId, controllerId, entity.Id, this.StateFacade, {
					Stage: newData1,
					Immolating: newData2,
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
