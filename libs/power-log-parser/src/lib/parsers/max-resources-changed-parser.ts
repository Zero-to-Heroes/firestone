import { GameTag } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider, GameEventHelper } from '../game-event';
import { Node, NodeType, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class MaxResourcesChangedParser implements ActionParser {
	readonly ParserName = 'MaxResourcesChangedParser';

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
		return (
			tagChange.Name === (GameTag.MAXRESOURCES as number) ||
			tagChange.Name === (GameTag.HEALTH as number) ||
			tagChange.Name === (GameTag.BACON_MAX_RESOURCES as number)
		);
	}

	AppliesOnCloseNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const tagChange = node.Object as TagChange;
		if (tagChange.Name === (GameTag.MAXRESOURCES as number)) {
			return this.HandleMaxMana(node);
		} else if (tagChange.Name === (GameTag.HEALTH as number)) {
			return this.HandleMaxHealth(node);
		} else if (tagChange.Name === (GameTag.BACON_MAX_RESOURCES as number)) {
			return this.HandleMaxCoins(node);
		}
		return null;
	}

	CreateGameEventProviderFromClose(_node: Node): GameEventProvider[] | null {
		return null;
	}

	private HandleMaxHealth(node: Node): GameEventProvider[] | null {
		const tagChange = node.Object as TagChange;
		const entity = this.GameState.CurrentEntities.get(tagChange.Entity);
		if (entity == null) {
			return null;
		}

		if (!entity.IsHero() || !entity.IsInPlay()) {
			return null;
		}

		const newHealth =
			tagChange.Name === (GameTag.HEALTH as number) ? tagChange.Value : entity.GetTag(GameTag.HEALTH);
		const cardId = entity.CardId;
		const controllerId = entity.GetEffectiveController();
		return [
			GameEventProvider.Create(
				tagChange.TimeStamp,
				'MAX_RESOURCES_UPDATED',
				GameEventHelper.CreateProvider(
					'MAX_RESOURCES_UPDATED',
					cardId,
					controllerId,
					entity.Id,
					this.StateFacade,
					{
						Health: newHealth,
					},
				),
				true,
				node,
			),
		];
	}

	private HandleMaxMana(node: Node): GameEventProvider[] | null {
		const tagChange = node.Object as TagChange;
		const entity = this.GameState.CurrentEntities.get(tagChange.Entity);
		if (entity == null) {
			return null;
		}

		const newMana =
			tagChange.Name === (GameTag.MAXRESOURCES as number)
				? tagChange.Value
				: entity.GetTag(GameTag.MAXRESOURCES);
		const cardId = entity.CardId;
		const controllerId = entity.GetEffectiveController();
		return [
			GameEventProvider.Create(
				tagChange.TimeStamp,
				'MAX_RESOURCES_UPDATED',
				GameEventHelper.CreateProvider(
					'MAX_RESOURCES_UPDATED',
					cardId,
					controllerId,
					entity.Id,
					this.StateFacade,
					{
						Mana: newMana,
					},
				),
				true,
				node,
			),
		];
	}

	private HandleMaxCoins(node: Node): GameEventProvider[] | null {
		const tagChange = node.Object as TagChange;
		const entity = this.GameState.CurrentEntities.get(tagChange.Entity);
		if (entity == null) {
			return null;
		}

		const newCoins =
			tagChange.Name === (GameTag.BACON_MAX_RESOURCES as number)
				? tagChange.Value
				: entity.GetTag(GameTag.BACON_MAX_RESOURCES);
		const cardId = entity.CardId;
		const controllerId = entity.GetEffectiveController();
		return [
			GameEventProvider.Create(
				tagChange.TimeStamp,
				'MAX_RESOURCES_UPDATED',
				GameEventHelper.CreateProvider(
					'MAX_RESOURCES_UPDATED',
					cardId,
					controllerId,
					entity.Id,
					this.StateFacade,
					{
						Coins: newCoins,
					},
				),
				true,
				node,
			),
		];
	}
}
