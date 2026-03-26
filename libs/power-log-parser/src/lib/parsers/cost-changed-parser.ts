import { GameTag } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider, GameEventHelper } from '../game-event';
import { Node, NodeType, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class CostChangedParser implements ActionParser {
	readonly ParserName = 'CostChangedParser';

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
			node.Type === NodeType.TagChange &&
			(node.Object as TagChange).Name === (GameTag.COST as number)
		);
	}

	AppliesOnCloseNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const tagChange = node.Object as TagChange;
		const entity = this.GameState.CurrentEntities.get(tagChange.Entity) ?? null;
		if (entity == null) {
			return null;
		}

		if (entity.GetTag(GameTag.LETTUCE_IS_EQUPIMENT) === 1) {
			return null;
		}

		const cardId = !entity.CardId ? null : entity.CardId;
		const controllerId = entity.GetEffectiveController();
		const abilityOwner = entity.GetTag(GameTag.LETTUCE_ABILITY_OWNER);
		return [
			GameEventProvider.Create(
				tagChange.TimeStamp,
				'COST_CHANGED',
				GameEventHelper.CreateProvider(
					'COST_CHANGED',
					cardId as any,
					controllerId,
					entity.Id,
					this.StateFacade,
					{
						NewCost: tagChange.Value,
						AbilityOwnerEntityId: abilityOwner,
					},
				),
				true,
				node,
			),
		];
	}

	CreateGameEventProviderFromClose(_node: Node): GameEventProvider[] | null {
		return null;
	}
}
