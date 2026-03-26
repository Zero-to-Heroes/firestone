import { CardType, GameTag, Zone } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventHelper, GameEventProvider } from '../game-event';
import { FullEntity, Node, NodeType, ShowEntity } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class MercenariesAbilityRevealedParser implements ActionParser {
	readonly ParserName = 'MercenariesAbilityRevealedParser';

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
		return (
			stateType === StateType.PowerTaskList &&
			((node.Type === NodeType.FullEntity &&
				(node.Object as FullEntity).GetTag(GameTag.ZONE) === (Zone.LETTUCE_ABILITY as number)) ||
				(node.Type === NodeType.ShowEntity &&
					(node.Object as ShowEntity).GetTag(GameTag.ZONE) === (Zone.LETTUCE_ABILITY as number)))
		);
	}

	CreateGameEventProviderFromNew(_node: Node): GameEventProvider[] | null {
		return null;
	}

	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null {
		if (node.Type === NodeType.FullEntity) {
			return this.CreateFromFullEntity(node);
		} else if (node.Type === NodeType.ShowEntity) {
			return this.CreateFromShowEntity(node);
		}
		return null;
	}

	private CreateFromFullEntity(node: Node): GameEventProvider[] | null {
		const fullEntity = node.Object as FullEntity;
		if (fullEntity.GetCardType() !== (CardType.LETTUCE_ABILITY as number)) {
			return null;
		}

		const creatorEntityId = fullEntity.GetTag(GameTag.CREATOR);
		const creatorEntity = this.GameState.CurrentEntities.get(creatorEntityId);
		if (creatorEntity?.GetCardType() === (CardType.ENCHANTMENT as number)) {
			return null;
		}

		const abilityOwner = fullEntity.GetTag(GameTag.LETTUCE_ABILITY_OWNER);
		const abilityCooldownConfig = fullEntity.GetTag(GameTag.LETTUCE_COOLDOWN_CONFIG);
		const abilityCurrentCooldown = fullEntity.GetTag(GameTag.LETTUCE_CURRENT_COOLDOWN);
		const abilitySpeed = fullEntity.GetTag(GameTag.COST);
		const isTreasure = fullEntity.GetTag(GameTag.LETTUCE_IS_TREASURE_CARD) === 1;
		const controllerId = fullEntity.GetEffectiveController();
		const cardId = fullEntity.CardId;
		const eventName =
			fullEntity.GetTag(GameTag.LETTUCE_IS_EQUPIMENT) === 1
				? 'MERCENARIES_EQUIPMENT_REVEALED'
				: 'MERCENARIES_ABILITY_REVEALED';
		return [
			GameEventProvider.Create(
				fullEntity.TimeStamp,
				eventName,
				GameEventHelper.CreateProvider(eventName, cardId, controllerId, fullEntity.Id, this.StateFacade, {
					AbilityOwnerEntityId: abilityOwner,
					AbilityCooldownConfig: abilityCooldownConfig === -1 ? null : abilityCooldownConfig,
					AbilityCurrentCooldown: abilityCurrentCooldown === -1 ? null : abilityCurrentCooldown,
					AbilitySpeed: abilitySpeed === -1 ? null : abilitySpeed,
					IsTreasure: isTreasure,
					AbilityNameData1: fullEntity.GetTag(GameTag.CARD_NAME_DATA_1),
				}),
				true,
				node,
			),
		];
	}

	private CreateFromShowEntity(node: Node): GameEventProvider[] | null {
		const showEntity = node.Object as ShowEntity;
		if (showEntity.GetCardType() !== (CardType.LETTUCE_ABILITY as number)) {
			return null;
		}

		const abilityOwner = showEntity.GetTag(GameTag.LETTUCE_ABILITY_OWNER);
		const abilityCooldownConfig = showEntity.GetTag(GameTag.LETTUCE_COOLDOWN_CONFIG);
		const abilityCurrentCooldown = showEntity.GetTag(GameTag.LETTUCE_CURRENT_COOLDOWN);
		const abilitySpeed = showEntity.GetTag(GameTag.COST);
		const isTreasure = showEntity.GetTag(GameTag.LETTUCE_IS_TREASURE_CARD) === 1;
		const controllerId = showEntity.GetEffectiveController();
		const cardId = showEntity.CardId;
		const eventName =
			showEntity.GetTag(GameTag.LETTUCE_IS_EQUPIMENT) === 1
				? 'MERCENARIES_EQUIPMENT_REVEALED'
				: 'MERCENARIES_ABILITY_REVEALED';
		return [
			GameEventProvider.Create(
				showEntity.TimeStamp,
				eventName,
				GameEventHelper.CreateProvider(eventName, cardId, controllerId, showEntity.Entity, this.StateFacade, {
					AbilityOwnerEntityId: abilityOwner,
					AbilityCooldownConfig: abilityCooldownConfig === -1 ? null : abilityCooldownConfig,
					AbilityCurrentCooldown: abilityCurrentCooldown === -1 ? null : abilityCurrentCooldown,
					AbilitySpeed: abilitySpeed === -1 ? null : abilitySpeed,
					IsTreasure: isTreasure,
				}),
				true,
				node,
			),
		];
	}
}
