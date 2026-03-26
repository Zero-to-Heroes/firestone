import { BlockType, CardType, GameTag, Zone } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventHelper, GameEventProvider } from '../game-event';
import { Action, Node, NodeType } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class MercenariesAbilityActivatedParser implements ActionParser {
	readonly ParserName = 'MercenariesAbilityActivatedParser';

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
			node.Type === NodeType.Action &&
			(action = node.Object as Action).Type === (BlockType.PLAY as number) &&
			this.GameState.CurrentEntities.has(action.Entity) &&
			this.GameState.CurrentEntities.get(action.Entity)!.GetZone() === (Zone.LETTUCE_ABILITY as number) &&
			this.GameState.CurrentEntities.get(action.Entity)!.GetCardType() === (CardType.LETTUCE_ABILITY as number)
		);
	}

	CreateGameEventProviderFromNew(_node: Node): GameEventProvider[] | null {
		return null;
	}

	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null {
		const action = node.Object as Action;
		const entity = this.GameState.CurrentEntities.get(action.Entity)!;
		const controllerId = entity.GetEffectiveController();
		const cardId = entity.CardId;
		const abilityOwnerEntityId = entity.GetTag(GameTag.LETTUCE_ABILITY_OWNER);
		const isTreasure = entity.GetTag(GameTag.LETTUCE_IS_TREASURE_CARD) === 1;
		return [
			GameEventProvider.Create(
				action.TimeStamp,
				'MERCENARIES_ABILITY_ACTIVATED',
				GameEventHelper.CreateProvider(
					'MERCENARIES_ABILITY_ACTIVATED',
					cardId,
					controllerId,
					entity.Id,
					this.StateFacade,
					{
						AbilityOwnerEntityId: abilityOwnerEntityId,
						IsTreasure: isTreasure,
					},
				),
				true,
				node,
			),
		];
	}
}
