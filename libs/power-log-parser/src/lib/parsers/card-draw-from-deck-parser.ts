import { BlockType, CardIds, GameTag, Zone } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider } from '../game-event';
import { Action, FullEntity, Node, NodeType, ShowEntity, TagChange } from '../models';
import { Obfuscator } from '../obfuscator';
import { Oracle } from '../oracle';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

const SHOULD_USE_ADVANCED_PREDICTION_FOR_CARD_DRAW: string[] = [
	CardIds.SuspiciousAlchemist_AMysteryEnchantment,
	CardIds.Mimicry_EDR_522,
];

const SHOULD_USE_ORACLE_TO_IDENTIFY_DRAWN_CARD: string[] = [CardIds.TalanjiOfTheGraves_TIME_619];

export class CardDrawFromDeckParser implements ActionParser {
	readonly ParserName = 'CardDrawFromDeckParser';

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
			(node.Object as TagChange).Value === (Zone.HAND as number) &&
			(this.GameState.CurrentEntities.get((node.Object as TagChange).Entity)?.GetTag(GameTag.ZONE) ===
				(Zone.DECK as number) ||
				this.GameState.CurrentEntities.get((node.Object as TagChange).Entity)?.GetTag(GameTag.ZONE) === -1)
		);
	}

	AppliesOnCloseNode(node: Node, stateType: StateType): boolean {
		const appliesToShowEntity =
			node.Type === NodeType.ShowEntity &&
			(node.Object as ShowEntity).GetTag(GameTag.ZONE) === (Zone.HAND as number) &&
			this.GameState.CurrentEntities.has((node.Object as ShowEntity).Entity) &&
			this.GameState.CurrentEntities.get((node.Object as ShowEntity).Entity)!.GetTag(GameTag.ZONE) ===
				(Zone.DECK as number);
		const appliesToFullEntity =
			node.Type === NodeType.FullEntity &&
			(node.Object as FullEntity).GetTag(GameTag.ZONE) === (Zone.HAND as number) &&
			this.GameState.CurrentEntities.has((node.Object as FullEntity).Id) &&
			this.GameState.CurrentEntities.get((node.Object as FullEntity).Id)!.GetTag(GameTag.ZONE) ===
				(Zone.DECK as number);
		return stateType === StateType.PowerTaskList && (appliesToShowEntity || appliesToFullEntity);
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const tagChange = node.Object as TagChange;
		const entityId = tagChange.Entity;
		const entity = this.GameState.CurrentEntities.get(entityId)!;
		const cardId = entity.CardId;

		const controllerId = entity.GetEffectiveController();
		const wasInDeck = entity.GetTag(GameTag.ZONE) === (Zone.DECK as number);
		const isBeforeMulligan = this.GameState.GetGameEntity()?.GetTag(GameTag.NEXT_STEP) === -1;
		if (isBeforeMulligan && cardId === CardIds.EncumberedPackMule) {
			return null;
		}

		const dataTag1 = entity.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_1, 0);
		const cost = entity.GetCost();

		const parentAction = node.Parent?.Object?.constructor === Action ? (node.Parent.Object as Action) : null;
		let drawnByCardId: string | null = null;
		let drawnByEntityId: number | null = null;
		let isTrade = false;
		let isCastsWhenDrawnReplacementDraw = false;
		if (parentAction != null) {
			const drawerEntityId = parentAction.Entity;
			const drawerEntity = this.GameState.CurrentEntities.get(drawerEntityId);
			isTrade =
				drawerEntity?.GetTag(GameTag.TRADEABLE) === 1 &&
				drawerEntity?.GetTag(GameTag.IS_USING_TRADE_OPTION) === 1;
			isCastsWhenDrawnReplacementDraw =
				parentAction.Type === (BlockType.TRIGGER as number) &&
				(parentAction.TriggerKeyword === (GameTag.CASTS_WHEN_DRAWN as number) ||
					parentAction.TriggerKeyword === (GameTag.TOPDECK as number) ||
					parentAction.TriggerKeyword === (GameTag.SUMMONED_WHEN_DRAWN as number));
			if (!isTrade && !isCastsWhenDrawnReplacementDraw) {
				drawnByCardId = drawerEntity?.CardId ?? null;
				drawnByEntityId = parentAction.Entity;
			}
		}

		let createdIndex: number | null = null;
		if (drawnByEntityId != null) {
			const drawnByEntity = this.GameState.CurrentEntities.get(drawnByEntityId);
			if (drawnByEntity) {
				createdIndex = drawnByEntity.CreatedIndex;
				drawnByEntity.CreatedIndex++;
			}
		}
		const revealed = entity.GetTag(GameTag.REVEALED) === 1;

		// Start section: moved outside of event provider
		// 2026-05-14: this was probably moved inside the event provider
		// so that we have more information when processing the event (eg the nodes have been completed)
		// The idea now is rather to use chains of events in that case, so that we don't rely on
		// timings that can be unreliable
		const creator = Oracle.FindCardCreator(this.GameState, entity, node, false);
		const lastInfluencedByCard = Oracle.FindCardCreator(this.GameState, entity, node);
		let lastInfluencedByCardId =
			isTrade || isCastsWhenDrawnReplacementDraw ? null : (lastInfluencedByCard?.[0] ?? null);
		let predictedCardId = Oracle.PredictCardId(this.GameState, creator?.[0], -1, node, cardId, this.StateFacade);
		let forcedOracle = false;
		if (SHOULD_USE_ORACLE_TO_IDENTIFY_DRAWN_CARD.includes(drawnByCardId!)) {
			predictedCardId =
				predictedCardId ??
				Oracle.PredictCardId(
					this.GameState,
					drawnByCardId,
					drawnByEntityId ?? -1,
					node,
					cardId,
					this.StateFacade,
					entityId,
				);
			forcedOracle = true;
		}
		if (SHOULD_USE_ADVANCED_PREDICTION_FOR_CARD_DRAW.includes(lastInfluencedByCardId!)) {
			predictedCardId =
				predictedCardId ??
				Oracle.PredictCardId(
					this.GameState,
					lastInfluencedByCardId,
					lastInfluencedByCard?.[1] ?? -1,
					node,
					cardId,
					this.StateFacade,
					entityId,
				);
			forcedOracle = true;
		}
		this.GameState.OnCardDrawn(entity.Entity);
		const finalCardId = cardId != null && cardId.length > 0 ? cardId : predictedCardId;
		const shouldObfuscate =
			!forcedOracle &&
			Obfuscator.shouldObfuscateCardDraw(
				entity,
				this.GameState,
				node,
				controllerId === this.StateFacade.LocalPlayer?.PlayerId,
				revealed,
			);
		// End section
		return [
			GameEventProvider.Create(
				tagChange.TimeStamp,
				'CARD_DRAW_FROM_DECK',
				() => {
					return {
						Type: 'CARD_DRAW_FROM_DECK',
						Value: {
							// Try using the prediceted card id in this case, as it's not read directly from the logs
							CardId: shouldObfuscate ? null : finalCardId,
							ControllerId: controllerId,
							LocalPlayer: this.StateFacade.LocalPlayer,
							OpponentPlayer: this.StateFacade.OpponentPlayer,
							EntityId: entity.Id,
							AdditionalProps: {
								IsPremium: shouldObfuscate ? false : entity.GetTag(GameTag.PREMIUM) === 1,
								CreatorCardId: Obfuscator.creatorCardIdForDrawEvent(
									shouldObfuscate,
									wasInDeck,
									creator?.[0] ?? null,
								),
								CreatorEntityId: shouldObfuscate ? null : (creator?.[1] ?? null),
								CreatedIndex: createdIndex,
								LastInfluencedByCardId: Obfuscator.creatorCardIdForDrawEvent(
									shouldObfuscate,
									wasInDeck,
									lastInfluencedByCardId,
								),
								DataTag1: shouldObfuscate ? 0 : dataTag1,
								Cost: shouldObfuscate ? 0 : cost,
								DrawnByCardId: drawnByCardId,
								DrawnByEntityId: drawnByEntityId,
								Tags: entity.GetTagsCopy(),
							},
						},
					};
				},
				true,
				node,
			),
		];
	}

	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null {
		if (node.Type === NodeType.ShowEntity) {
			return this.createEventFromShowEntity(node.Object as ShowEntity, node);
		} else if (node.Type === NodeType.FullEntity) {
			return this.createEventFromFullEntity(node.Object as FullEntity, node);
		}
		return null;
	}

	private createEventFromShowEntity(showEntity: ShowEntity, node: Node): GameEventProvider[] | null {
		const cardId = showEntity.CardId;
		const controllerId = showEntity.GetEffectiveController();
		const entity = this.GameState.CurrentEntities.get(showEntity.Entity)!;
		const wasInDeck = entity.GetTag(GameTag.ZONE) === (Zone.DECK as number);
		const isBeforeMulligan = this.GameState.GetGameEntity()?.GetTag(GameTag.NEXT_STEP) === -1;

		const dataTag1 = entity.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_1, 0);
		const cost = showEntity.GetCost();
		const parentAction = node.Parent?.Object?.constructor === Action ? (node.Parent.Object as Action) : null;
		let drawnByCardId: string | null = null;
		let drawnByEntityId: number | null = null;
		let isCastsWhenDrawnReplacementDraw = false;
		if (parentAction != null) {
			const drawerEntityId = parentAction.Entity;
			const drawerEntity = this.GameState.CurrentEntities.get(drawerEntityId);
			isCastsWhenDrawnReplacementDraw =
				parentAction.Type === (BlockType.TRIGGER as number) &&
				(parentAction.TriggerKeyword === (GameTag.CASTS_WHEN_DRAWN as number) ||
					parentAction.TriggerKeyword === (GameTag.TOPDECK as number) ||
					parentAction.TriggerKeyword === (GameTag.SUMMONED_WHEN_DRAWN as number));
			if (!isCastsWhenDrawnReplacementDraw) {
				drawnByCardId = drawerEntity?.CardId ?? null;
				drawnByEntityId = parentAction.Entity;
			}
		}

		let createdIndex: number | null = null;
		if (drawnByEntityId != null) {
			const drawnByEntity = this.GameState.CurrentEntities.get(drawnByEntityId);
			if (drawnByEntity) {
				createdIndex = drawnByEntity.CreatedIndex;
				drawnByEntity.CreatedIndex++;
			}
		}
		return [
			GameEventProvider.Create(
				showEntity.TimeStamp,
				'CARD_DRAW_FROM_DECK',
				() => {
					if (
						isBeforeMulligan &&
						cardId === CardIds.EncumberedPackMule &&
						controllerId !== this.StateFacade.LocalPlayer?.PlayerId
					) {
						return null;
					}
					const creatorCardId = Oracle.FindCardCreatorFromShowEntity(this.GameState, showEntity, node);
					const lastInfluencedByCardId = isCastsWhenDrawnReplacementDraw
						? null
						: Oracle.FindCardCreatorFromShowEntity(this.GameState, showEntity, node);
					this.GameState.OnCardDrawn(showEntity.Entity);
					return {
						Type: 'CARD_DRAW_FROM_DECK',
						Value: {
							CardId: cardId,
							ControllerId: controllerId,
							LocalPlayer: this.StateFacade.LocalPlayer,
							OpponentPlayer: this.StateFacade.OpponentPlayer,
							EntityId: showEntity.Entity,
							AdditionalProps: {
								IsPremium:
									entity.GetTag(GameTag.PREMIUM) === 1 || showEntity.GetTag(GameTag.PREMIUM) === 1,
								CreatorCardId:
									creatorCardId?.[0] && creatorCardId?.[0] !== drawnByCardId
										? creatorCardId?.[0]
										: null,
								CreatorEntityId:
									creatorCardId?.[1] && creatorCardId?.[1] !== drawnByEntityId
										? creatorCardId?.[1]
										: null,
								CreatedIndex: createdIndex,
								LastInfluencedByCardId: lastInfluencedByCardId?.[0] ?? null,
								DataTag1: dataTag1,
								Cost: cost,
								DrawnByCardId: drawnByCardId,
								DrawnByEntityId: drawnByEntityId,
								Tags: entity.GetTagsCopy(),
							},
						},
					};
				},
				true,
				node,
			),
		];
	}

	private createEventFromFullEntity(fullEntity: FullEntity, node: Node): GameEventProvider[] | null {
		let cardId = fullEntity.CardId;
		const controllerId = fullEntity.GetEffectiveController();
		const wasInDeck = fullEntity.GetTag(GameTag.ZONE) === (Zone.DECK as number);
		const isBeforeMulligan = this.GameState.GetGameEntity()?.GetTag(GameTag.NEXT_STEP) === -1;
		if (isBeforeMulligan && cardId === CardIds.EncumberedPackMule) {
			cardId = '';
		}

		const dataTag1 = fullEntity.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_1, 0);
		const cost = fullEntity.GetCost();
		const parentAction = node.Parent?.Object?.constructor === Action ? (node.Parent.Object as Action) : null;
		let drawnByCardId: string | null = null;
		let drawnByEntityId: number | null = null;
		let isCastsWhenDrawnReplacementDraw = false;
		if (parentAction != null) {
			const drawerEntityId = parentAction.Entity;
			const drawerEntity = this.GameState.CurrentEntities.get(drawerEntityId);
			isCastsWhenDrawnReplacementDraw =
				parentAction.Type === (BlockType.TRIGGER as number) &&
				(parentAction.TriggerKeyword === (GameTag.CASTS_WHEN_DRAWN as number) ||
					parentAction.TriggerKeyword === (GameTag.TOPDECK as number) ||
					parentAction.TriggerKeyword === (GameTag.SUMMONED_WHEN_DRAWN as number));
			if (!isCastsWhenDrawnReplacementDraw) {
				drawnByCardId = drawerEntity?.CardId ?? null;
				drawnByEntityId = parentAction.Entity;
			}
		}

		let createdIndex: number | null = null;
		if (drawnByEntityId != null) {
			const drawnByEntity = this.GameState.CurrentEntities.get(drawnByEntityId);
			if (drawnByEntity) {
				createdIndex = drawnByEntity.CreatedIndex;
				drawnByEntity.CreatedIndex++;
			}
		}
		return [
			GameEventProvider.Create(
				fullEntity.TimeStamp,
				'CARD_DRAW_FROM_DECK',
				() => {
					const creator = Oracle.FindCardCreator(this.GameState, fullEntity, node, false);
					const lastInfluencedByCardId = isCastsWhenDrawnReplacementDraw
						? null
						: (Oracle.FindCardCreator(this.GameState, fullEntity, node)?.[0] ?? null);
					this.GameState.OnCardDrawn(fullEntity.Entity);
					return {
						Type: 'CARD_DRAW_FROM_DECK',
						Value: {
							CardId: cardId,
							ControllerId: controllerId,
							LocalPlayer: this.StateFacade.LocalPlayer,
							OpponentPlayer: this.StateFacade.OpponentPlayer,
							EntityId: fullEntity.Entity,
							AdditionalProps: {
								IsPremium: fullEntity.GetTag(GameTag.PREMIUM) === 1,
								CreatorCardId: creator?.[0] ?? null,
								CreatorEntityId: creator?.[1] ?? null,
								CreatedIndex: createdIndex,
								LastInfluencedByCardId: lastInfluencedByCardId,
								DataTag1: dataTag1,
								Cost: cost,
								DrawnByCardId: drawnByCardId,
								DrawnByEntityId: drawnByEntityId,
								Tags: fullEntity.GetTagsCopy(),
							},
						},
					};
				},
				true,
				node,
			),
		];
	}
}
