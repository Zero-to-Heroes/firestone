import { GameTag } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider, GameEventHelper } from '../game-event';
import { FullEntity, Node, NodeType, ShowEntity, TagChange } from '../models';
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
			node.Type === NodeType.TagChange &&
			(node.Object as TagChange).Name === (GameTag.LINKED_ENTITY as number)
		);
	}

	AppliesOnCloseNode(node: Node, stateType: StateType): boolean {
		if (stateType !== StateType.PowerTaskList) {
			return false;
		}
		// ShowEntity / FullEntity may embed LINKED_ENTITY (reconnect / mid-game Discover snapshots).
		if (node.Type === NodeType.ShowEntity) {
			return (node.Object as ShowEntity).GetTag(GameTag.LINKED_ENTITY) > 0;
		}
		if (node.Type === NodeType.FullEntity) {
			return (node.Object as FullEntity).GetTag(GameTag.LINKED_ENTITY) > 0;
		}
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

	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null {
		const source = node.Object as ShowEntity | FullEntity;
		const linkedEntityId = source.GetTag(GameTag.LINKED_ENTITY);
		if (!this.GameState.CurrentEntities.has(linkedEntityId)) {
			return null;
		}

		const linkedEntity = this.GameState.CurrentEntities.get(linkedEntityId)!;
		if (linkedEntity.Id === source.Entity) {
			return null;
		}

		// Same as COPIED_FROM: FullEntity Creating closes before CurrentEntities registration.
		const cardId = source.CardId;
		const controllerId = source.GetEffectiveController();
		// Opponent ShowEntity/FullEntity often embeds LINKED_ENTITY on dredge/discover previews.
		// Emitting LINKED_ENTITY here writes the revealed cardId onto the linked deck row and
		// bypasses CopiedFrom's dredge obfuscation (info leak). Keep TagChange LINKED as-is;
		// only emit close events for the local player's own links (e.g. Tracking Discover).
		if (controllerId !== this.StateFacade.LocalPlayer?.PlayerId) {
			return null;
		}
		return [
			GameEventProvider.Create(
				source.TimeStamp,
				'LINKED_ENTITY',
				GameEventHelper.CreateProvider('LINKED_ENTITY', cardId, controllerId, source.Entity, this.StateFacade, {
					LinkedEntityId: linkedEntityId,
					LinkedEntityControllerId: linkedEntity.GetEffectiveController(),
					LinkedEntityZone: linkedEntity.GetZone(),
					LinkedEntityCost: linkedEntity.GetCost(),
				}),
				true,
				node,
			),
		];
	}
}
