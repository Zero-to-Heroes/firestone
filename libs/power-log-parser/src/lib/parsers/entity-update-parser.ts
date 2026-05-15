import { BlockType, CardIds, GameTag, Zone } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventHelper, GameEventProvider } from '../game-event';
import { Action, Node, NodeType, ShowEntity } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class EntityUpdateParser implements ActionParser {
	readonly ParserName = 'EntityUpdateParser';

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
		return stateType === StateType.PowerTaskList && node.Type === NodeType.ShowEntity;
	}

	CreateGameEventProviderFromNew(_node: Node): GameEventProvider[] | null {
		return null;
	}

	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null {
		const showEntity = node.Object as ShowEntity;
		if (showEntity.SubSpellInEffect?.Prefab === 'DMFFX_SpawnToDeck_CthunTheShattered_CardFromScript_FX') {
			return null;
		}

		if (
			showEntity.GetTag(GameTag.LAST_AFFECTED_BY) !== -1 &&
			this.GameState.CurrentEntities.has(showEntity.GetTag(GameTag.LAST_AFFECTED_BY)) &&
			this.GameState.CurrentEntities.get(showEntity.GetTag(GameTag.LAST_AFFECTED_BY))!.CardId === CardIds.OhMyYogg
		) {
			return null;
		}

		let cardId = showEntity.CardId;
		const isBeforeMulligan = this.GameState.GetGameEntity()!.GetTag(GameTag.NEXT_STEP) === -1;
		if (
			isBeforeMulligan &&
			cardId === CardIds.EncumberedPackMule &&
			showEntity.GetEffectiveController() !== this.StateFacade.LocalPlayer!.PlayerId
		) {
			cardId = '';
		}
		if (
			showEntity.IsImmolateDiscard() &&
			showEntity.GetEffectiveController() !== this.StateFacade.LocalPlayer!.PlayerId
		) {
			cardId = '';
		}
		if (node.Parent?.Object instanceof Action) {
			const parentAction = node.Parent.Object as Action;
			const parentEntity = this.GameState.CurrentEntities.get(parentAction.Entity);
			if (parentEntity?.CardId === CardIds.Kiljaeden_KiljaedensPortalEnchantment_GDB_145e) {
				cardId = '';
			}
		}

		const controllerId = showEntity.GetEffectiveController();
		const mercXp = showEntity.GetTag(GameTag.LETTUCE_MERCENARY_EXPERIENCE);
		const mercEquipmentId = showEntity.GetTag(GameTag.LETTUCE_EQUIPMENT_ID);
		const abilityOwner = showEntity.GetTag(GameTag.LETTUCE_ABILITY_OWNER);
		const abilityCooldownConfig = showEntity.GetTag(GameTag.LETTUCE_COOLDOWN_CONFIG);
		const abilityCurrentCooldown = showEntity.GetTag(GameTag.LETTUCE_CURRENT_COOLDOWN);
		const abilitySpeed = showEntity.GetTag(GameTag.COST);
		const zonePosition = showEntity.GetZonePosition();
		const dataNum1 = showEntity.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_1);
		const dataNum2 = showEntity.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_2);
		const eventName =
			showEntity.GetTag(GameTag.ZONE) === (Zone.LETTUCE_ABILITY as number)
				? showEntity.GetTag(GameTag.LETTUCE_IS_EQUPIMENT) === 1
					? 'MERCENARIES_EQUIPMENT_UPDATE'
					: 'MERCENARIES_ABILITY_UPDATE'
				: 'ENTITY_UPDATE';
		let zone = showEntity.GetZone();
		const blockAction = node.Parent?.Object as Action | null;
		const debug = showEntity.Entity == 41;
		const gsEntity = this.StateFacade.GsState?.GameState.CurrentEntities.get(showEntity.Entity);
		const revealed =
			(showEntity.GetTag(GameTag.REVEALED) === 1 &&
				showEntity.GetTag(GameTag.START_OF_GAME_KEYWORD) !== 1 &&
				// In some cases (like Start of Game effects that trigger while the card is in hand), the card
				// is revealed, then hidden right away. In this case, we consider that the card is not revealed.
				this.StateFacade.GsState?.GameState.CurrentEntities.get(showEntity.Entity)?.GetTag(GameTag.REVEALED) ===
					1) ||
			(blockAction != null && blockAction.Type === (BlockType.PLAY as number) && zone === (Zone.PLAY as number));
		if (zone === -1) {
			zone = this.GameState.CurrentEntities.get(showEntity.Entity)?.GetZone() ?? -1;
		}
		return [
			GameEventProvider.Create(
				showEntity.TimeStamp,
				eventName,
				GameEventHelper.CreateProvider(eventName, cardId, controllerId, showEntity.Entity, this.StateFacade, {
					MercenariesExperience: mercXp,
					MercenariesEquipmentId: mercEquipmentId,
					AbilityOwnerEntityId: abilityOwner,
					AbilityCooldownConfig: abilityCooldownConfig === -1 ? null : abilityCooldownConfig,
					AbilityCurrentCooldown: abilityCurrentCooldown === -1 ? null : abilityCurrentCooldown,
					AbilitySpeed: abilitySpeed === -1 ? null : abilitySpeed,
					ZonePosition: zonePosition,
					Zone: zone,
					Revealed: revealed,
					DataNum1: dataNum1,
					DataNum2: dataNum2,
				}),
				true,
				node,
				{ Mindrender: true },
			),
		];
	}
}
