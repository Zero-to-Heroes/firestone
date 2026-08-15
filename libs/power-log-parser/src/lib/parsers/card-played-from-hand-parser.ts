import { BlockType, CardIds, CardType, GameTag, Zone } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { nodePlayPaidWithAlternateCost } from '../action-paid-with-alternate-cost';
import { GameEventHelper, GameEventProvider } from '../game-event';
import { Action, FullEntity, Node, NodeType, ShowEntity, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class CardPlayedFromHandParser implements ActionParser {
	readonly ParserName = 'CardPlayedFromHandParser';

	private GameState: GameState;
	private ParserState: ParserState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, stateFacade: StateFacade) {
		this.ParserState = parserState;
		this.GameState = parserState.GameState;
		this.StateFacade = stateFacade;
	}

	AppliesOnNewNode(node: Node, stateType: StateType): boolean {
		if (stateType !== StateType.PowerTaskList) {
			return false;
		}
		const isTriggerPhase =
			node.Parent == null ||
			node.Parent.Type !== NodeType.Action ||
			(node.Parent.Object as Action).Type === (BlockType.TRIGGER as number);
		const isPowerPhase =
			node.Parent == null ||
			node.Parent.Type !== NodeType.Action ||
			(node.Parent.Object as Action).Type === (BlockType.POWER as number);

		const sigilPlayed =
			!isTriggerPhase &&
			node.Type === NodeType.TagChange &&
			(node.Object as TagChange).Name === (GameTag.ZONE as number) &&
			(node.Object as TagChange).Value === (Zone.SECRET as number) &&
			this.GameState.CurrentEntities.get((node.Object as TagChange).Entity)?.GetTag(GameTag.SIGIL) === 1 &&
			this.GameState.CurrentEntities.get((node.Object as TagChange).Entity)?.GetTag(GameTag.ZONE) ===
				(Zone.HAND as number);

		let tagChange: TagChange;
		let tagChangeEntity: FullEntity | undefined;
		const cardPlayed =
			node.Type === NodeType.TagChange &&
			(tagChange = node.Object as TagChange).Name === (GameTag.ZONE as number) &&
			tagChange.Value === (Zone.PLAY as number) &&
			(tagChangeEntity = this.GameState.CurrentEntities.get(tagChange.Entity))?.GetTag(GameTag.ZONE) ===
				(Zone.HAND as number) &&
			((!isTriggerPhase && !isPowerPhase) || tagChangeEntity!.GetTag(GameTag.CASTS_WHEN_DRAWN) === 1);
		return sigilPlayed || cardPlayed;
	}

	AppliesOnCloseNode(node: Node, stateType: StateType): boolean {
		return (
			stateType === StateType.PowerTaskList &&
			node.Type === NodeType.ShowEntity &&
			node.Parent != null &&
			node.Parent.Type === NodeType.Action &&
			(node.Parent.Object as Action).Type === (BlockType.PLAY as number)
		);
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const tagChange = node.Object as TagChange;
		const entity = this.GameState.CurrentEntities.get(tagChange.Entity)!;
		const cardId = entity.CardId;
		const controllerId = entity.GetEffectiveController();
		if (
			this.GameState.CurrentEntities.get(tagChange.Entity)!.GetTag(GameTag.CARDTYPE) !==
			(CardType.ENCHANTMENT as number)
		) {
			let targetId = -1;
			let targetCardId: string | null = null;
			if (node.Parent!.Type === NodeType.Action) {
				const action = node.Parent!.Object as Action;
				targetId = action.Target;
				targetCardId = targetId > 0 ? (this.GameState.CurrentEntities.get(targetId)?.CardId ?? null) : null;
			}
			const creator = entity.GetTag(GameTag.CREATOR);
			const creatorCardId =
				creator !== -1 && this.GameState.CurrentEntities.has(creator)
					? this.GameState.CurrentEntities.get(creator)!.CardId
					: null;
			const creatorEntityId = creator === -1 ? null : creator;

			const gsEntities = this.StateFacade.GsState!.GameState.CurrentEntities;
			const magnetizedTo = [...gsEntities.values()]
				.reverse()
				.find((e) => e.GetTag(GameTag.CREATOR) === tagChange.Entity && e.GetTag(GameTag.MAGNETIC) === 1);
			const magnetized = magnetizedTo != null;

			this.GameState.OnCardPlayed(tagChange.Entity, targetId);
			const dormant =
				this.StateFacade.GsState!.GameState.CurrentEntities.get(entity.Entity)?.GetTag(GameTag.DORMANT) === 1;
			const additionalProps = {
				TargetEntityId: targetId,
				TargetCardId: targetCardId,
				Attack: entity.GetTag(GameTag.ATK, 0),
				Health: entity.GetTag(GameTag.HEALTH, 0),
				CreatorCardId: creatorCardId,
				CreatorEntityId: creatorEntityId,
				Immune: entity.GetTag(GameTag.IMMUNE) === 1,
				Dormant: dormant,
				Cost: entity.GetTag(GameTag.COST, 0),
				Magnetized: magnetized,
				Tags: entity.GetTagsCopy(),
			};
			return [
				GameEventProvider.Create(
					tagChange.TimeStamp,
					'CARD_PLAYED',
					() => ({
						Type: 'CARD_PLAYED',
						Value: {
							CardId: cardId,
							ControllerId: controllerId,
							LocalPlayer: this.StateFacade.LocalPlayer,
							OpponentPlayer: this.StateFacade.OpponentPlayer,
							EntityId: entity.Id,
							AdditionalProps: {
								...additionalProps,
								PaidWithAlternateCost: nodePlayPaidWithAlternateCost(node),
							},
						},
					}),
					true,
					node,
					null,
					100,
				),
			];
		}
		return null;
	}

	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null {
		const showEntity = node.Object as ShowEntity;
		if (showEntity.GetTag(GameTag.CARDTYPE) === (CardType.ENCHANTMENT as number)) {
			return null;
		}

		const isOhMyYogg =
			showEntity.GetTag(GameTag.LAST_AFFECTED_BY) !== -1 &&
			this.GameState.CurrentEntities.has(showEntity.GetTag(GameTag.LAST_AFFECTED_BY)) &&
			this.GameState.CurrentEntities.get(showEntity.GetTag(GameTag.LAST_AFFECTED_BY))!.CardId ===
				CardIds.OhMyYogg;
		const isSigil =
			showEntity.GetTag(GameTag.ZONE) === (Zone.SECRET as number) && showEntity.GetTag(GameTag.SIGIL) === 1;
		if (showEntity.GetTag(GameTag.ZONE) === (Zone.PLAY as number) || isSigil || isOhMyYogg) {
			const parentAction = node.Parent!.Object as Action;
			const cardId = showEntity.CardId;
			const controllerId = showEntity.GetEffectiveController();
			const targetId = parentAction.Target;
			const targetCardId = targetId > 0 ? (this.GameState.CurrentEntities.get(targetId)?.CardId ?? null) : null;
			const creator = showEntity.GetTag(GameTag.CREATOR);
			const creatorCardId =
				creator !== -1 && this.GameState.CurrentEntities.has(creator)
					? this.GameState.CurrentEntities.get(creator)!.CardId
					: null;
			const creatorEntityId = creator === -1 ? null : creator;

			const gsEntities = this.StateFacade.GsState!.GameState.CurrentEntities;
			const magnetizedTo = [...gsEntities.values()]
				.reverse()
				.find((e) => e.GetTag(GameTag.CREATOR) === showEntity.Entity && e.GetTag(GameTag.MAGNETIC) === 1);
			const magnetized = magnetizedTo != null;

			const fullEntity = FullEntity.FromShowEntity(showEntity);
			this.GameState.OnCardPlayed(showEntity.Entity, targetId, fullEntity);
			const copiedFromEntityId = showEntity.GetTag(GameTag.COPIED_FROM_ENTITY_ID);
			const additionalProps = {
				TargetEntityId: targetId,
				TargetCardId: targetCardId,
				CreatorCardId: creatorCardId,
				CreatorEntityId: creatorEntityId,
				// No idea why this being a copied card would make it transient
				// If the opponent draws a card created by Commander Beatrix, then play it, it has a creator
				// When they play it, if there is a "created by Commander Beatrix" card in the hand or deck, we want to
				// remove it
				TransientCard: isOhMyYogg, // || copiedFromEntityId > 0 || creator !== -1,
				Immune: showEntity.GetTag(GameTag.IMMUNE) === 1,
				Magnetized: magnetized,
				Tags: showEntity.Tags,
			};
			return [
				GameEventProvider.Create(
					showEntity.TimeStamp,
					'CARD_PLAYED',
					GameEventHelper.CreateProviderWithDeferredProps(
						'CARD_PLAYED',
						cardId,
						controllerId,
						showEntity.Entity,
						this.StateFacade,
						() => ({
							...additionalProps,
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
}
