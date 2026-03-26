import { GameTag } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider, GameEventHelper } from '../game-event';
import { Node, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class LinkedEntityParser implements ActionParser {
	readonly ParserName = 'LinkedEntityParser';

	private GameState: GameState;
	private ParserState: ParserState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, facade: StateFacade) {
		this.ParserState = parserState;
		this.GameState = parserState.GameState;
		this.StateFacade = facade;
	}

	AppliesOnNewNode(node: Node, stateType: StateType): boolean {
		return (
			stateType === StateType.PowerTaskList &&
			node.Type === TagChange &&
			(node.Object as TagChange).Name === (GameTag.LINKED_ENTITY as number)
		);
	}

	AppliesOnCloseNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const tagChange = node.Object as TagChange;
		const entity = this.GameState.CurrentEntities.get(tagChange.Entity)!;
		const cardId = entity.CardId;
		if (!this.GameState.CurrentEntities.has(tagChange.Value)) {
			return null;
		}

		const linkedEntity = this.GameState.CurrentEntities.get(tagChange.Value)!;
		if (linkedEntity?.Id === tagChange.Entity) {
			return null;
		}

		const controllerId = entity.GetEffectiveController();
		return [
			GameEventProvider.Create(
				tagChange.TimeStamp,
				'LINKED_ENTITY',
				GameEventHelper.CreateProvider('LINKED_ENTITY', cardId, controllerId, entity.Id, this.StateFacade, {
					LinkedEntityId: tagChange.Value,
					LinkedEntityControllerId: linkedEntity.GetEffectiveController(),
					LinkedEntityZone: linkedEntity.GetZone(),
					LinkedEntityCost: linkedEntity.GetCost(),
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
