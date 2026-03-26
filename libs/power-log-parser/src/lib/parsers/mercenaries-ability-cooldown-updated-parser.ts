import { GameTag } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider, GameEventHelper } from '../game-event';
import { Node, NodeType, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class MercenariesAbilityCooldownUpdatedParser implements ActionParser {
	readonly ParserName = 'MercenariesAbilityCooldownUpdatedParser';

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
			(node.Object as TagChange).Name === (GameTag.LETTUCE_CURRENT_COOLDOWN as number)
		);
	}

	AppliesOnCloseNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const tagChange = node.Object as TagChange;
		const entity = this.GameState.CurrentEntities.get(tagChange.Entity)!;
		const cardId = entity.CardId;
		const controllerId = entity.GetEffectiveController();
		const newCooldownValue = tagChange.Value;
		const abilityOwner = entity.GetTag(GameTag.LETTUCE_ABILITY_OWNER);
		return [
			GameEventProvider.Create(
				tagChange.TimeStamp,
				'MERCENARIES_COOLDOWN_UPDATED',
				GameEventHelper.CreateProvider(
					'MERCENARIES_COOLDOWN_UPDATED',
					cardId,
					controllerId,
					entity.Id,
					this.StateFacade,
					{
						NewCooldown: newCooldownValue,
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
