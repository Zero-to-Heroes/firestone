import { GameTag, MetaTags, Zone } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventHelper, GameEventProvider } from '../game-event';
import { Action, FullEntity, MetaData, Node, NodeType, ShowEntity, TagChange } from '../models';
import { isIgnoredSpawnToDeckFxPrefab } from '../ignore-spawn-to-deck-fx-prefabs';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class CardRemovedFromDeckParser implements ActionParser {
	readonly ParserName = 'CardRemovedFromDeckParser';

	private GameState: GameState;
	private ParserState: ParserState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, stateFacade: StateFacade) {
		this.ParserState = parserState;
		this.GameState = parserState.GameState;
		this.StateFacade = stateFacade;
	}

	AppliesOnNewNode(node: Node, stateType: StateType): boolean {
		let tagChange: TagChange | null = null;
		return (
			stateType === StateType.PowerTaskList &&
			node.Type === NodeType.TagChange &&
			(tagChange = node.Object as TagChange).Name === (GameTag.ZONE as number) &&
			(tagChange.Value === (Zone.SETASIDE as number) || tagChange.Value === (Zone.GRAVEYARD as number)) &&
			this.GameState.CurrentEntities.get((node.Object as TagChange).Entity)?.GetTag(GameTag.ZONE) ===
				(Zone.DECK as number)
		);
	}

	AppliesOnCloseNode(node: Node, stateType: StateType): boolean {
		const appliesToShowEntity =
			node.Type === NodeType.ShowEntity &&
			((node.Object as ShowEntity).GetTag(GameTag.ZONE) === (Zone.SETASIDE as number) ||
				(node.Object as ShowEntity).GetTag(GameTag.ZONE) === (Zone.GRAVEYARD as number)) &&
			this.GameState.CurrentEntities.has((node.Object as ShowEntity).Entity) &&
			this.GameState.CurrentEntities.get((node.Object as ShowEntity).Entity)!.GetTag(GameTag.ZONE) ===
				(Zone.DECK as number);
		const appliesToFullEntity =
			node.Type === NodeType.FullEntity &&
			((node.Object as FullEntity).GetTag(GameTag.ZONE) === (Zone.SETASIDE as number) ||
				(node.Object as FullEntity).GetTag(GameTag.ZONE) === (Zone.GRAVEYARD as number)) &&
			this.GameState.CurrentEntities.has((node.Object as FullEntity).Id) &&
			this.GameState.CurrentEntities.get((node.Object as FullEntity).Id)!.GetTag(GameTag.ZONE) ===
				(Zone.DECK as number);
		return stateType === StateType.PowerTaskList && (appliesToShowEntity || appliesToFullEntity);
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const tagChange = node.Object as TagChange;
		if (isIgnoredSpawnToDeckFxPrefab(tagChange.SubSpellInEffect?.Prefab)) {
			return null;
		}

		const entity = this.GameState.CurrentEntities.get(tagChange.Entity)!;
		const controllerId = entity.GetEffectiveController();
		const isOpponent = controllerId !== this.StateFacade.LocalPlayer?.PlayerId;
		const cardId =
			isOpponent &&
			entity.GetTag(GameTag.SUPPRESS_MILL_ANIMATION) === 1 &&
			entity.GetTag(GameTag.IGNORE_SUPPRESS_MILL_ANIMATION) <= 0
				? null
				: entity.CardId;

		let removedByCardId: string | null = null;
		let removedByEntityId: number | null = null;
		if (node.Parent!.Type === NodeType.Action) {
			const act = node.Parent!.Object as Action;
			removedByCardId = this.GameState.CurrentEntities.get(act.Entity)?.CardId ?? null;
			removedByEntityId = act.Entity;
		}

		return [
			GameEventProvider.Create(
				tagChange.TimeStamp,
				'CARD_REMOVED_FROM_DECK',
				GameEventHelper.CreateProvider(
					'CARD_REMOVED_FROM_DECK',
					cardId ?? (null as any),
					controllerId,
					entity.Id,
					this.StateFacade,
					{
						RemovedByCardId: removedByCardId,
						RemovedByEntityId: removedByEntityId,
					},
				),
				true,
				node,
			),
		];
	}

	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null {
		if (node.Type === NodeType.ShowEntity) {
			return this.createEventFromShowEntity(node, node.Object as ShowEntity);
		} else if (node.Type === NodeType.FullEntity) {
			return this.createEventFromFullEntity(node, node.Object as FullEntity);
		}
		return null;
	}

	private createEventFromShowEntity(node: Node, showEntity: ShowEntity): GameEventProvider[] | null {
		if (isIgnoredSpawnToDeckFxPrefab(showEntity.SubSpellInEffect?.Prefab)) {
			return null;
		}
		let removedByCardId: string | null = null;
		let removedByEntityId: number | null = null;
		if (node.Parent!.Type === NodeType.Action) {
			const act = node.Parent!.Object as Action;
			const cardBurned = act.Data.filter((data) => data.constructor === MetaData)
				.map((data) => data as unknown as MetaData)
				.filter((meta) => meta.Meta === (MetaTags.BURNED_CARD as number))
				.map((meta) => meta.MetaInfo[0])
				.some((info) => info.Entity === showEntity.Entity);
			if (cardBurned) {
				return null;
			}
			removedByCardId = this.GameState.CurrentEntities.get(act.Entity)?.CardId ?? null;
			removedByEntityId = act.Entity;
		}

		const controllerId = showEntity.GetEffectiveController();
		const isOpponent = controllerId !== this.StateFacade.LocalPlayer?.PlayerId;
		const cardId =
			isOpponent &&
			showEntity.GetTag(GameTag.SUPPRESS_MILL_ANIMATION) === 1 &&
			showEntity.GetTag(GameTag.IGNORE_SUPPRESS_MILL_ANIMATION) <= 0
				? null
				: showEntity.CardId;
		return [
			GameEventProvider.Create(
				showEntity.TimeStamp,
				'CARD_REMOVED_FROM_DECK',
				GameEventHelper.CreateProvider(
					'CARD_REMOVED_FROM_DECK',
					cardId ?? (null as any),
					controllerId,
					showEntity.Entity,
					this.StateFacade,
					{
						Cost: showEntity.GetCost(),
						RemovedByCardId: removedByCardId,
						RemovedByEntityId: removedByEntityId,
					},
				),
				true,
				node,
			),
		];
	}

	private createEventFromFullEntity(node: Node, fullEntity: FullEntity): GameEventProvider[] | null {
		if (isIgnoredSpawnToDeckFxPrefab(fullEntity.SubSpellInEffect?.Prefab)) {
			return null;
		}
		if (node.Parent!.Type === NodeType.Action) {
			const act = node.Parent!.Object as Action;
			const cardBurned = act.Data.filter((data) => data.constructor === MetaData)
				.map((data) => data as unknown as MetaData)
				.filter((meta) => meta.Meta === (MetaTags.BURNED_CARD as number))
				.map((meta) => meta.MetaInfo[0])
				.some((info) => info.Entity === fullEntity.Id);
			if (cardBurned) {
				return null;
			}
		}

		const controllerId = fullEntity.GetEffectiveController();
		const isOpponent = controllerId !== this.StateFacade.LocalPlayer?.PlayerId;
		const cardId =
			isOpponent &&
			fullEntity.GetTag(GameTag.SUPPRESS_MILL_ANIMATION) === 1 &&
			fullEntity.GetTag(GameTag.IGNORE_SUPPRESS_MILL_ANIMATION) <= 0
				? null
				: fullEntity.CardId;
		return [
			GameEventProvider.Create(
				fullEntity.TimeStamp,
				'CARD_REMOVED_FROM_DECK',
				GameEventHelper.CreateProvider(
					'CARD_REMOVED_FROM_DECK',
					cardId ?? (null as any),
					controllerId,
					fullEntity.Id,
					this.StateFacade,
				),
				true,
				node,
			),
		];
	}
}
