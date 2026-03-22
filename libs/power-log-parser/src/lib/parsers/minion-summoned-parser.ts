import { BlockType, GameTag, Zone } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventHelper, GameEventProvider } from '../game-event';
import { Action, FullEntity, Node, ShowEntity, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class MinionSummonedParser implements ActionParser {
	readonly ParserName = 'MinionSummonedParser';

	private GameState: GameState;
	private ParserState: ParserState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, stateFacade: StateFacade) {
		this.ParserState = parserState;
		this.GameState = parserState.GameState;
		this.StateFacade = stateFacade;
	}

	AppliesOnNewNode(node: Node, stateType: StateType): boolean {
		const isTriggerPhase =
			node.Parent == null ||
			node.Parent.Type !== Action ||
			(node.Parent.Object as Action).Type === (BlockType.TRIGGER as number);
		const isPowerPhase =
			node.Parent == null ||
			node.Parent.Type !== Action ||
			(node.Parent.Object as Action).Type === (BlockType.POWER as number);
		if (!isTriggerPhase && !isPowerPhase) {
			return false;
		}
		return (
			stateType === StateType.PowerTaskList &&
			node.Type === TagChange &&
			(node.Object as TagChange).Name === (GameTag.ZONE as number) &&
			(node.Object as TagChange).Value === (Zone.PLAY as number) &&
			this.GameState.CurrentEntities.has((node.Object as TagChange).Entity) &&
			this.GameState.CurrentEntities.get((node.Object as TagChange).Entity)!.IsMinionLike()
		);
	}

	AppliesOnCloseNode(node: Node, stateType: StateType): boolean {
		const createFromFullEntity =
			node.Type === FullEntity &&
			(node.Object as FullEntity).GetTag(GameTag.ZONE) === (Zone.PLAY as number) &&
			(node.Object as FullEntity).IsMinionLike();
		const createFromShowEntity =
			node.Type === ShowEntity &&
			(node.Object as ShowEntity).GetTag(GameTag.ZONE) === (Zone.PLAY as number) &&
			(node.Object as ShowEntity).IsMinionLike() &&
			this.GameState.CurrentEntities.has((node.Object as ShowEntity).Entity) &&
			this.GameState.CurrentEntities.get((node.Object as ShowEntity).Entity)!.GetTag(GameTag.ZONE) !==
				(Zone.PLAY as number);
		return stateType === StateType.PowerTaskList && (createFromFullEntity || createFromShowEntity);
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const tagChange = node.Object as TagChange;
		const entity = this.GameState.CurrentEntities.get(tagChange.Entity)!;
		const cardId = entity.CardId;
		const controllerId = entity.GetEffectiveController();
		const creatorEntityId = entity.GetTag(GameTag.CREATOR);
		const creatorEntityCardId = this.GameState.CurrentEntities.has(creatorEntityId)
			? this.GameState.CurrentEntities.get(creatorEntityId)!.CardId
			: null;
		const eventName =
			entity.GetTag(GameTag.ZONE) === (Zone.HAND as number) ? 'MINION_SUMMONED_FROM_HAND' : 'MINION_SUMMONED';
		return [
			GameEventProvider.Create(
				tagChange.TimeStamp,
				eventName,
				GameEventHelper.CreateProvider(eventName, cardId, controllerId, entity.Id, this.StateFacade, {
					CreatorCardId: creatorEntityCardId,
					CreatorEntityId: creatorEntityId,
					Tags: entity.Tags,
				}),
				true,
				node,
			),
		];
	}

	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null {
		const isPlayBlock =
			node.Parent != null &&
			node.Parent.Type === Action &&
			(node.Parent.Object as Action).Type === (BlockType.PLAY as number);
		if (isPlayBlock) {
			const parentAction = node.Parent!.Object as Action;
			const createdEntityId =
				node.Type === FullEntity
					? (node.Object as FullEntity).Entity
					: (node.Object as ShowEntity).Entity;
			if (createdEntityId === parentAction.Entity) {
				return null;
			}
		}

		if (node.Type === FullEntity) {
			return this.CreateFromFullEntity(node);
		} else {
			return this.CreateFromShowEntity(node);
		}
	}

	private CreateFromFullEntity(node: Node): GameEventProvider[] | null {
		const fullEntity = node.Object as FullEntity;
		const cardId = fullEntity.CardId;
		const controllerId = fullEntity.GetEffectiveController();
		const creatorEntityId = fullEntity.GetTag(GameTag.CREATOR);
		const creatorEntityCardId = this.GameState.CurrentEntities.has(creatorEntityId)
			? this.GameState.CurrentEntities.get(creatorEntityId)!.CardId
			: null;
		return [
			GameEventProvider.Create(
				fullEntity.TimeStamp,
				'MINION_SUMMONED',
				GameEventHelper.CreateProvider(
					'MINION_SUMMONED',
					cardId,
					controllerId,
					fullEntity.Id,
					this.StateFacade,
					{
						CreatorCardId: creatorEntityCardId,
						CreatorEntityId: creatorEntityId,
						Tags: fullEntity.Tags,
					},
				),
				true,
				node,
			),
		];
	}

	private CreateFromShowEntity(node: Node): GameEventProvider[] | null {
		const showEntity = node.Object as ShowEntity;
		const cardId = showEntity.CardId;
		const controllerId = showEntity.GetEffectiveController();
		const creatorEntityId = showEntity.GetTag(GameTag.CREATOR);
		const creatorEntityCardId = this.GameState.CurrentEntities.has(creatorEntityId)
			? this.GameState.CurrentEntities.get(creatorEntityId)!.CardId
			: null;
		const previousZone = this.GameState.CurrentEntities.get(showEntity.Entity)!.GetTag(GameTag.ZONE);
		const eventName = previousZone === (Zone.HAND as number) ? 'MINION_SUMMONED_FROM_HAND' : 'MINION_SUMMONED';
		return [
			GameEventProvider.Create(
				showEntity.TimeStamp,
				eventName,
				GameEventHelper.CreateProvider(
					eventName,
					cardId,
					controllerId,
					showEntity.Entity,
					this.StateFacade,
					{
						CreatorCardId: creatorEntityCardId,
						CreatorEntityId: creatorEntityId,
						Tags: showEntity.Tags,
					},
				),
				true,
				node,
			),
		];
	}
}
