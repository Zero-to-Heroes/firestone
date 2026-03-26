import { CardType, GameTag } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEvent, GameEventProvider } from '../game-event';
import { Action, ShowEntity } from '../models/action';
import { Node, NodeType, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';
import { MindrenderIlluciaParser } from './mindrender-illucia-parser';

export class CardStolenParser implements ActionParser {
	readonly ParserName = 'CardStolenParser';

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
			(node.Object as TagChange).Name === (GameTag.CONTROLLER as number) &&
			!MindrenderIlluciaParser.IsProcessingMindrenderIlluciaEffect(node, this.GameState)
		);
	}

	AppliesOnCloseNode(node: Node, stateType: StateType): boolean {
		return (
			stateType === StateType.PowerTaskList &&
			node.Type === NodeType.ShowEntity &&
			this.GameState.CurrentEntities.has((node.Object as ShowEntity).Entity) &&
			this.GameState.CurrentEntities.get((node.Object as ShowEntity).Entity)!.GetEffectiveController() !==
				(node.Object as ShowEntity).GetEffectiveController() &&
			!MindrenderIlluciaParser.IsProcessingMindrenderIlluciaEffect(node, this.GameState)
		);
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const tagChange = node.Object as TagChange;
		const entity = this.GameState.CurrentEntities.get(tagChange.Entity)!;
		const controllerId = entity.GetEffectiveController();
		const lettuceControllerId = entity.GetTag(GameTag.LETTUCE_CONTROLLER);
		if (tagChange.Value === lettuceControllerId) {
			return null;
		}

		if (
			this.GameState.CurrentEntities.get(tagChange.Entity)!.GetTag(GameTag.CARDTYPE) !==
			(CardType.ENCHANTMENT as number)
		) {
			const zone = entity.GetZone();
			let stolenByCardId: string | null = null;
			let stolenByEntityId: number | null = null;
			if (node.Parent?.Type === NodeType.Action) {
				const parentAction = node.Parent.Object as Action;
				stolenByEntityId = parentAction.Entity;
				stolenByCardId = this.GameState.CurrentEntities.get(parentAction.Entity)?.CardId ?? null;
			}
			const cardId = entity.CardId;
			return [
				GameEventProvider.Create(
					tagChange.TimeStamp,
					'CARD_STOLEN',
					(): GameEvent => ({
						Type: 'CARD_STOLEN',
						Value: {
							CardId: cardId,
							ControllerId: controllerId,
							LocalPlayer: this.StateFacade.LocalPlayer,
							OpponentPlayer: this.StateFacade.OpponentPlayer,
							EntityId: entity.Id,
							AdditionalProps: {
								newControllerId: tagChange.Value,
								zone: zone,
								StolenByCardId: stolenByCardId,
								StolenByEntityId: stolenByEntityId,
							},
						},
					}),
					true,
					node,
				),
			];
		}
		return null;
	}

	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null {
		const showEntity = node.Object as ShowEntity;
		const cardId = showEntity.CardId;
		const controllerId = this.GameState.CurrentEntities.get(showEntity.Entity)!.GetEffectiveController();
		const lettuceControllerId = showEntity.GetTag(GameTag.LETTUCE_CONTROLLER);
		if (showEntity.GetEffectiveController() === lettuceControllerId) {
			return null;
		}

		if (
			this.GameState.CurrentEntities.get(showEntity.Entity)!.GetTag(GameTag.CARDTYPE) !==
			(CardType.ENCHANTMENT as number)
		) {
			const zone = showEntity.GetZone();
			return [
				GameEventProvider.Create(
					showEntity.TimeStamp,
					'CARD_STOLEN',
					(): GameEvent => {
						let stolenByCardId: string | null = null;
						let stolenByEntityId: number | null = null;
						if (node.Parent?.Type === NodeType.Action) {
							const parentAction = node.Parent.Object as Action;
							stolenByEntityId = parentAction.Entity;
							stolenByCardId =
								this.GameState.CurrentEntities.get(parentAction.Entity)?.CardId ?? null;
						}
						return {
							Type: 'CARD_STOLEN',
							Value: {
								CardId: cardId,
								ControllerId: controllerId,
								LocalPlayer: this.StateFacade.LocalPlayer,
								OpponentPlayer: this.StateFacade.OpponentPlayer,
								EntityId: showEntity.Entity,
								AdditionalProps: {
									newControllerId: showEntity.GetEffectiveController(),
									StolenByCardId: stolenByCardId,
									StolenByEntityId: stolenByEntityId,
									zone: zone,
								},
							},
						};
					},
					true,
					node,
				),
			];
		}
		return null;
	}
}
