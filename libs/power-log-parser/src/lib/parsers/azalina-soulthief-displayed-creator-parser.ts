import { CardIds, CardType, GameTag, Zone } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventHelper, GameEventProvider } from '../game-event';
import { FullEntity, Node, NodeType, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

/**
 * Modern Azalina Soulthief (GIL_198) often logs DISPLAYED_CREATOR pointing at the played minion
 * but omits COPIED_FROM_ENTITY_ID on the copied hand cards. The deck tracker needs that link to
 * reveal the opponent's hand when we see copies (same ZONE_POSITION as the source hand).
 */
export class AzalinaSoulthiefDisplayedCreatorParser implements ActionParser {
	readonly ParserName = 'AzalinaSoulthiefDisplayedCreatorParser';

	private GameState: GameState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, stateFacade: StateFacade) {
		this.GameState = parserState.GameState;
		this.StateFacade = stateFacade;
	}

	AppliesOnNewNode(node: Node, stateType: StateType): boolean {
		if (stateType !== StateType.PowerTaskList || node.Type !== NodeType.TagChange) {
			return false;
		}
		const tagChange = node.Object as TagChange;
		if (tagChange.Name !== (GameTag.DISPLAYED_CREATOR as number)) {
			return false;
		}
		if (!this.GameState.CurrentEntities.has(tagChange.Entity)) {
			return false;
		}
		const creatorEntity = this.GameState.CurrentEntities.get(tagChange.Value);
		if (!creatorEntity?.CardId || creatorEntity.CardId !== CardIds.AzalinaSoulthief) {
			return false;
		}
		const copyEntity = this.GameState.CurrentEntities.get(tagChange.Entity)!;
		if (copyEntity.GetTag(GameTag.CARDTYPE) === (CardType.ENCHANTMENT as number)) {
			return false;
		}
		// Native COPIED_FROM_ENTITY_ID present — let CopiedFromEntityIdParser handle it.
		if (copyEntity.GetTag(GameTag.COPIED_FROM_ENTITY_ID) > 0) {
			return false;
		}
		return copyEntity.GetZone() === Zone.HAND;
	}

	AppliesOnCloseNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const tagChange = node.Object as TagChange;
		const copyEntity = this.GameState.CurrentEntities.get(tagChange.Entity)!;
		const copiedEntity = this.findSourceHandEntityAtSameZonePosition(copyEntity);
		if (!copiedEntity) {
			return null;
		}

		const cardId = copyEntity.CardId?.length ? copyEntity.CardId : copiedEntity.CardId;
		const controllerId = copyEntity.GetEffectiveController();
		const copiedCardEntityId = copiedEntity.Id;
		const copiedCardControllerId = copiedEntity.GetController();

		return [
			GameEventProvider.Create(
				tagChange.TimeStamp,
				'COPIED_FROM_ENTITY_ID',
				GameEventHelper.CreateProvider(
					'COPIED_FROM_ENTITY_ID',
					cardId,
					controllerId,
					copyEntity.Id,
					this.StateFacade,
					{
						CopiedCardControllerId: copiedCardControllerId,
						CopiedCardEntityId: copiedCardEntityId,
						CopiedCardZone: copiedEntity.GetZone(),
						CopiedCardCost: copiedEntity.GetTag(GameTag.COST),
						CopiedCardAttack: copiedEntity.GetTag(GameTag.ATK),
						CopiedCardHealth: copiedEntity.GetTag(GameTag.HEALTH),
						SyntheticAzalinaHandCopy: true,
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

	private findSourceHandEntityAtSameZonePosition(copyEntity: FullEntity): FullEntity | null {
		const zonePos = copyEntity.GetZonePosition();
		if (zonePos <= 0) {
			return null;
		}
		const copyController = copyEntity.GetEffectiveController();
		const sourceController = copyController === 1 ? 2 : copyController === 2 ? 1 : null;
		if (sourceController == null) {
			return null;
		}

		for (const entity of this.GameState.CurrentEntities.values()) {
			if (entity.Id === copyEntity.Id) {
				continue;
			}
			if (entity.GetEffectiveController() !== sourceController) {
				continue;
			}
			if (entity.GetZone() !== Zone.HAND) {
				continue;
			}
			if (entity.GetZonePosition() !== zonePos) {
				continue;
			}
			if (entity.GetTag(GameTag.CARDTYPE) === (CardType.ENCHANTMENT as number)) {
				continue;
			}
			return entity;
		}
		return null;
	}
}
