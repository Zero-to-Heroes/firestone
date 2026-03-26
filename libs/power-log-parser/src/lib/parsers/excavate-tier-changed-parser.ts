import { GameTag } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider, GameEventHelper } from '../game-event';
import { Node, NodeType, PlayerEntity, Tag, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class ExcavateTierChangedParser implements ActionParser {
	readonly ParserName = 'ExcavateTierChangedParser';

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
			(node.Object as TagChange).Name === (GameTag.CURRENT_EXCAVATE_TIER as number)
		);
	}

	AppliesOnCloseNode(node: Node, stateType: StateType): boolean {
		if (stateType !== StateType.PowerTaskList || node.Type !== NodeType.PlayerEntity) {
			return false;
		}
		const tags = (node.Object as PlayerEntity).Tags;
		return (
			tags.find((tag) => tag.Name === (GameTag.CURRENT_EXCAVATE_TIER as number)) != null ||
			tags.find((tag) => tag.Name === (GameTag.MAX_EXCAVATE_TIER as number)) != null
		);
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const tagChange = node.Object as TagChange;
		const entity = this.GameState.CurrentEntities.get(tagChange.Entity);
		if (entity == null) {
			return null;
		}

		const maxExcavateTier = entity.GetTag(GameTag.MAX_EXCAVATE_TIER, 0);
		const currentExcavateTier = tagChange.Value;
		const cardId = entity.CardId;
		const controllerId = entity.GetEffectiveController();
		return [
			GameEventProvider.Create(
				tagChange.TimeStamp,
				'EXCAVATE_TIER_CHANGED',
				GameEventHelper.CreateProvider(
					'EXCAVATE_TIER_CHANGED',
					cardId,
					controllerId,
					entity.Id,
					this.StateFacade,
					{
						CurrentTier: currentExcavateTier,
						MaxTier: maxExcavateTier,
					},
				),
				true,
				node,
			),
		];
	}

	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null {
		const playerEntity = node.Object as PlayerEntity;
		const maxExcavateTier =
			playerEntity.Tags.find((tag) => tag.Name === (GameTag.MAX_EXCAVATE_TIER as number))?.Value ?? 3;
		const currentExcavateTier =
			playerEntity.Tags.find((tag) => tag.Name === (GameTag.CURRENT_EXCAVATE_TIER as number))?.Value ?? 0;

		const controllerId = playerEntity.GetEffectiveController();
		return [
			GameEventProvider.Create(
				playerEntity.TimeStamp,
				'EXCAVATE_TIER_CHANGED',
				GameEventHelper.CreateProvider(
					'EXCAVATE_TIER_CHANGED',
					null as any,
					controllerId,
					playerEntity.Id,
					this.StateFacade,
					{
						CurrentTier: currentExcavateTier,
						MaxTier: maxExcavateTier,
					},
				),
				true,
				node,
			),
		];
	}
}
