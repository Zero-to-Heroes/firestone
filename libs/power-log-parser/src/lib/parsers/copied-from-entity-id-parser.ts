import { CardType, GameTag } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventHelper, GameEventProvider } from '../game-event';
import { Node, ShowEntity, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class CopiedFromEntityIdParser implements ActionParser {
	readonly ParserName = 'CopiedFromEntityIdParser';

	private GameState: GameState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, stateFacade: StateFacade) {
		this.GameState = parserState.GameState;
		this.StateFacade = stateFacade;
	}

	AppliesOnNewNode(node: Node, stateType: StateType): boolean {
		return (
			stateType === StateType.PowerTaskList &&
			node.Type === TagChange &&
			(node.Object as TagChange).Name === (GameTag.COPIED_FROM_ENTITY_ID as number)
		);
	}

	AppliesOnCloseNode(node: Node, stateType: StateType): boolean {
		return (
			stateType === StateType.PowerTaskList &&
			node.Type === ShowEntity &&
			(node.Object as ShowEntity).GetTag(GameTag.COPIED_FROM_ENTITY_ID) > 0
		);
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const tagChange = node.Object as TagChange;
		const entity = this.GameState.CurrentEntities.get(tagChange.Entity)!;
		const cardId = entity.CardId;
		const controllerId = entity.GetEffectiveController();
		if (entity.GetTag(GameTag.CARDTYPE) === (CardType.ENCHANTMENT as number)) {
			return null;
		}

		if (!this.GameState.CurrentEntities.has(tagChange.Value)) {
			return null;
		}

		const copiedEntity = this.GameState.CurrentEntities.get(tagChange.Value)!;
		const copiedCardEntityId = tagChange.Value;
		const copiedCardControllerId = copiedEntity.GetController();
		return [
			GameEventProvider.Create(
				tagChange.TimeStamp,
				'COPIED_FROM_ENTITY_ID',
				GameEventHelper.CreateProvider('COPIED_FROM_ENTITY_ID', cardId, controllerId, entity.Id, this.StateFacade, {
					CopiedCardControllerId: copiedCardControllerId,
					CopiedCardEntityId: copiedCardEntityId,
					CopiedCardZone: copiedEntity.GetZone(),
					CopiedCardCost: copiedEntity.GetTag(GameTag.COST),
					CopiedCardAttack: copiedEntity.GetTag(GameTag.ATK),
					CopiedCardHealth: copiedEntity.GetTag(GameTag.HEALTH),
				}),
				true,
				node,
			),
		];
	}

	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null {
		const showEntity = node.Object as ShowEntity;
		if (this.GameState.CurrentEntities.get(showEntity.Entity)!.GetTag(GameTag.CARDTYPE) === (CardType.ENCHANTMENT as number)) {
			return null;
		}

		const copiedCardEntityId = showEntity.GetTag(GameTag.COPIED_FROM_ENTITY_ID);
		if (!this.GameState.CurrentEntities.has(copiedCardEntityId)) {
			return null;
		}

		const entity = this.GameState.CurrentEntities.get(showEntity.Entity)!;
		const cardId = entity.CardId;
		const controllerId = entity.GetEffectiveController();
		const copiedEntity = this.GameState.CurrentEntities.get(copiedCardEntityId)!;
		const copiedCardControllerId = copiedEntity.GetController();
		return [
			GameEventProvider.Create(
				showEntity.TimeStamp,
				'COPIED_FROM_ENTITY_ID',
				GameEventHelper.CreateProvider(
					'COPIED_FROM_ENTITY_ID',
					cardId || copiedEntity?.CardId,
					controllerId,
					entity.Id,
					this.StateFacade,
					{
						CopiedCardControllerId: copiedCardControllerId,
						CopiedCardEntityId: copiedCardEntityId,
						CopiedCardZone: copiedEntity.GetZone(),
						CopiedCardCost: copiedEntity.GetTag(GameTag.COST),
						CopiedCardAttack: copiedEntity.GetTag(GameTag.ATK),
						CopiedCardHealth: copiedEntity.GetTag(GameTag.HEALTH),
					},
				),
				true,
				node,
			),
		];
	}
}
