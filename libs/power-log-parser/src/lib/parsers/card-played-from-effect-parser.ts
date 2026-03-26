import { BlockType, CardType, GameTag, Zone } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventHelper, GameEventProvider } from '../game-event';
import { Action, FullEntity, Node, NodeType, ShowEntity, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class CardPlayedFromEffectParser implements ActionParser {
	readonly ParserName = 'CardPlayedFromEffectParser';

	private GameState: GameState;
	private ParserState: ParserState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, stateFacade: StateFacade) {
		this.ParserState = parserState;
		this.GameState = parserState.GameState;
		this.StateFacade = stateFacade;
	}

	AppliesOnNewNode(node: Node, stateType: StateType): boolean {
		const isPowerPhase =
			node.Parent == null ||
			node.Parent.Type !== NodeType.Action ||
			(node.Parent.Object as Action).Type === (BlockType.POWER as number) ||
			(node.Parent.Object as Action).Type === (BlockType.TRIGGER as number);

		let tagChange: TagChange | null = null;
		let tagChangeEntity: FullEntity | undefined;
		const cardPlayed =
			node.Type === NodeType.TagChange &&
			(tagChange = node.Object as TagChange).Name === (GameTag.ZONE as number) &&
			tagChange.Value === (Zone.PLAY as number) &&
			((tagChangeEntity = this.GameState.CurrentEntities.get(tagChange.Entity))?.GetTag(GameTag.ZONE) ===
				(Zone.SETASIDE as number) ||
				tagChangeEntity?.GetZone() === (Zone.REMOVEDFROMGAME as number));

		let action: Action | null = null;
		const castWhenDrawn =
			node.Type === NodeType.Action &&
			(action = node.Object as Action).Type === (BlockType.TRIGGER as number) &&
			(action.TriggerKeyword === (GameTag.CASTS_WHEN_DRAWN as number) ||
				action.TriggerKeyword === (GameTag.TOPDECK as number));
		return stateType === StateType.PowerTaskList && ((isPowerPhase && cardPlayed) || castWhenDrawn);
	}

	AppliesOnCloseNode(node: Node, stateType: StateType): boolean {
		const isPowerPhase =
			node.Parent == null ||
			node.Parent.Type !== NodeType.Action ||
			(node.Parent.Object as Action).Type === (BlockType.POWER as number);

		let showEntity: ShowEntity | null = null;
		const cardPlayed =
			node.Type === NodeType.ShowEntity &&
			(showEntity = node.Object as ShowEntity).GetZone() === (Zone.PLAY as number) &&
			showEntity.GetCardType() !== (CardType.ENCHANTMENT as number);
		return stateType === StateType.PowerTaskList && isPowerPhase && cardPlayed;
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		if (node.Type === NodeType.TagChange) {
			return this.CreateGameEventProviderFromTagChange(node);
		} else {
			return this.CreateGameEventProviderFromCastsWhenDrawnAction(node);
		}
	}

	private CreateGameEventProviderFromTagChange(node: Node): GameEventProvider[] | null {
		const tagChange = node.Object as TagChange;
		const entity = this.GameState.CurrentEntities.get(tagChange.Entity)!;
		const cardId = entity.CardId;
		if (cardId == null || cardId.length === 0) {
			return null;
		}

		const controllerId = entity.GetEffectiveController();
		const cardType = this.GameState.CurrentEntities.get(tagChange.Entity)!.GetTag(GameTag.CARDTYPE);
		if (cardType === (CardType.ENCHANTMENT as number) || cardType === (CardType.HERO_POWER as number)) {
			return null;
		}

		const action = node.Parent?.Object as Action | undefined;
		const targetId = action?.Target ?? 0;
		const targetCardId =
			targetId > 0 ? this.GameState.CurrentEntities.get(targetId)?.CardId ?? null : null;
		const creator = entity.GetTag(GameTag.CREATOR);
		const creatorCardId =
			creator !== -1 && this.GameState.CurrentEntities.has(creator)
				? this.GameState.CurrentEntities.get(creator)!.CardId
				: null;
		const creatorEntityId =
			creator !== -1 && this.GameState.CurrentEntities.has(creator)
				? this.GameState.CurrentEntities.get(creator)!.Entity
				: -1;

		return [
			GameEventProvider.Create(
				tagChange.TimeStamp,
				'CARD_PLAYED_BY_EFFECT',
				GameEventHelper.CreateProvider(
					'CARD_PLAYED_BY_EFFECT',
					cardId,
					controllerId,
					entity.Id,
					this.StateFacade,
					{
						TargetEntityId: targetId,
						TargetCardId: targetCardId,
						CreatorCardId: creatorCardId,
						CreatorEntityId: creatorEntityId,
						Tags: entity.GetTagsCopy(),
					},
				),
				true,
				node,
			),
		];
	}

	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null {
		if (node.Type === NodeType.ShowEntity) {
			return this.CreateGameEventProviderFromShowEntity(node);
		}
		return null;
	}

	private CreateGameEventProviderFromCastsWhenDrawnAction(node: Node): GameEventProvider[] | null {
		const action = node.Object as Action;
		const entity = this.GameState.CurrentEntities.get(action.Entity);
		if (entity?.IsMinion()) {
			return null;
		}
		const cardId = entity?.CardId ?? null;
		const controllerId = entity!.GetEffectiveController();
		const targetId = action?.Target ?? 0;
		const targetCardId =
			targetId > 0 ? this.GameState.CurrentEntities.get(targetId)?.CardId ?? null : null;
		const creator = entity!.GetTag(GameTag.CREATOR);
		const creatorCardId =
			creator !== -1 && this.GameState.CurrentEntities.has(creator)
				? this.GameState.CurrentEntities.get(creator)!.CardId
				: null;
		const creatorEntityId =
			creator !== -1 && this.GameState.CurrentEntities.has(creator)
				? this.GameState.CurrentEntities.get(creator)!.Entity
				: -1;

		return [
			GameEventProvider.Create(
				action.TimeStamp,
				'CARD_PLAYED_BY_EFFECT',
				GameEventHelper.CreateProvider(
					'CARD_PLAYED_BY_EFFECT',
					cardId as any,
					controllerId,
					entity!.Entity,
					this.StateFacade,
					{
						TargetEntityId: targetId,
						TargetCardId: targetCardId,
						CreatorCardId: creatorCardId,
						CreatorEntityId: creatorEntityId,
						CastWhenDrawn: true,
						Tags: entity!.GetTagsCopy(),
					},
				),
				true,
				node,
			),
		];
	}

	private CreateGameEventProviderFromShowEntity(node: Node): GameEventProvider[] | null {
		const entity = node.Object as ShowEntity;
		const cardId = entity.CardId;
		const controllerId = entity.GetEffectiveController();
		const cardType = entity.GetTag(GameTag.CARDTYPE);
		if (
			cardId.length === 0 ||
			cardType === (CardType.ENCHANTMENT as number) ||
			cardType === (CardType.HERO_POWER as number)
		) {
			return null;
		}

		const action = node.Parent?.Object as Action | undefined;
		const targetId = action?.Target ?? 0;
		const targetCardId =
			targetId > 0 ? this.GameState.CurrentEntities.get(targetId)?.CardId ?? null : null;
		const creator = entity.GetTag(GameTag.CREATOR);
		const creatorCardId =
			creator !== -1 && this.GameState.CurrentEntities.has(creator)
				? this.GameState.CurrentEntities.get(creator)!.CardId
				: null;
		const creatorEntityId =
			creator !== -1 && this.GameState.CurrentEntities.has(creator)
				? this.GameState.CurrentEntities.get(creator)!.Entity
				: -1;

		return [
			GameEventProvider.Create(
				entity.TimeStamp,
				'CARD_PLAYED_BY_EFFECT',
				GameEventHelper.CreateProvider(
					'CARD_PLAYED_BY_EFFECT',
					cardId,
					controllerId,
					entity.Entity,
					this.StateFacade,
					{
						TargetEntityId: targetId,
						TargetCardId: targetCardId,
						CreatorCardId: creatorCardId,
						CreatorEntityId: creatorEntityId,
						Tags: entity.GetTagsCopy(),
					},
				),
				true,
				node,
			),
		];
	}
}
