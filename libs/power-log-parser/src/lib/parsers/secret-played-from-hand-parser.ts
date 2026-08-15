import { BlockType, CardIds, CardType, GameTag, Zone } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { nodePlayPaidWithAlternateCost } from '../action-paid-with-alternate-cost';
import { GameEventHelper, GameEventProvider } from '../game-event';
import { Action, Node, NodeType, ShowEntity, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class SecretPlayedFromHandParser implements ActionParser {
	readonly ParserName = 'SecretPlayedFromHandParser';

	private GameState: GameState;
	private ParserState: ParserState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, stateFacade: StateFacade) {
		this.ParserState = parserState;
		this.GameState = parserState.GameState;
		this.StateFacade = stateFacade;
	}

	AppliesOnNewNode(node: Node, stateType: StateType): boolean {
		return (
			stateType === StateType.PowerTaskList &&
			node.Type === NodeType.TagChange &&
			(node.Object as TagChange).Name === (GameTag.ZONE as number) &&
			(node.Object as TagChange).Value === (Zone.SECRET as number) &&
			this.GameState.CurrentEntities.get((node.Object as TagChange).Entity)?.GetTag(GameTag.ZONE) ===
				(Zone.HAND as number)
		);
	}

	AppliesOnCloseNode(node: Node, stateType: StateType): boolean {
		return (
			stateType === StateType.PowerTaskList &&
			node.Type === NodeType.Action &&
			(node.Object as Action).Type === (BlockType.PLAY as number)
		);
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const tagChange = node.Object as TagChange;
		const entity = this.GameState.CurrentEntities.get(tagChange.Entity)!;
		const cardId = entity.CardId;
		const controllerId = entity.GetEffectiveController();
		if (entity.GetTag(GameTag.CARDTYPE) !== (CardType.ENCHANTMENT as number)) {
			let eventName = 'QUEST_PLAYED';
			if (this.GameState.CurrentEntities.get(tagChange.Entity)!.GetTag(GameTag.SECRET) === 1) {
				eventName = 'SECRET_PLAYED';
			} else if (node.Parent != null && node.Parent.Type === NodeType.Action) {
				const parentAction = node.Parent.Object as Action;
				if (
					(parentAction.Type === (BlockType.TRIGGER as number) ||
						parentAction.Type === (BlockType.POWER as number)) &&
					this.GameState.CurrentEntities.has(parentAction.Entity) &&
					this.GameState.CurrentEntities.get(parentAction.Entity)!.CardId === CardIds.SparkjoyCheat
				) {
					eventName = 'SECRET_PUT_IN_PLAY';
				}
			}
			const playerClass = entity.GetPlayerClass();
			const creatorEntityId = entity.GetTag(GameTag.CREATOR);
			const creatorEntityCardId = this.GameState.CurrentEntities.has(creatorEntityId)
				? this.GameState.CurrentEntities.get(creatorEntityId)!.CardId
				: null;
			this.GameState.OnCardPlayed(tagChange.Entity);
			return [
				GameEventProvider.Create(
					tagChange.TimeStamp,
					eventName,
					GameEventHelper.CreateProviderWithDeferredProps(
						eventName,
						cardId,
						controllerId,
						entity.Id,
						this.StateFacade,
						() => ({
							PlayerClass: playerClass,
							CreatorCardId: creatorEntityCardId,
							Cost: entity.GetTag(GameTag.COST, 0),
							PaidWithAlternateCost: nodePlayPaidWithAlternateCost(node),
						}),
					),
					true,
					node,
				),
			];
		}
		return null;
	}

	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null {
		const action = node.Object as Action;
		for (const data of action.Data) {
			if (data instanceof ShowEntity) {
				const showEntity = data as ShowEntity;
				if (
					showEntity.GetTag(GameTag.ZONE) === (Zone.SECRET as number) &&
					showEntity.GetTag(GameTag.CARDTYPE) !== (CardType.ENCHANTMENT as number) &&
					showEntity.GetTag(GameTag.SIGIL) !== 1
				) {
					const cardId = showEntity.CardId;
					const controllerId = showEntity.GetEffectiveController();
					const playerClass = showEntity.GetPlayerClass();
					const eventName = showEntity.GetTag(GameTag.SECRET) === 1 ? 'SECRET_PLAYED' : 'QUEST_PLAYED';
					this.GameState.OnCardPlayed(showEntity.Entity);
					return [
						GameEventProvider.Create(
							action.TimeStamp,
							eventName,
							GameEventHelper.CreateProviderWithDeferredProps(
								eventName,
								cardId,
								controllerId,
								showEntity.Entity,
								this.StateFacade,
								() => ({
									PlayerClass: playerClass,
									Cost: showEntity.GetTag(GameTag.COST, 0),
									PaidWithAlternateCost: nodePlayPaidWithAlternateCost(node),
								}),
							),
							true,
							node,
						),
					];
				}
			}
		}
		return null;
	}
}
