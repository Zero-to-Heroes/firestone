import { BlockType, CardIds, GameTag, Zone } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider, GameEventHelper } from '../game-event';
import { Action, FullEntity, MetaData, Node, NodeType, ShowEntity } from '../models';
import { MetaDataType } from '../enums';
import { isIgnoredSpawnToDeckFxPrefab } from '../ignore-spawn-to-deck-fx-prefabs';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

const SPECIAL_CASE_CARD_IDS: string[] = [CardIds.FindTheImposter_SpyOMaticToken, CardIds.DisarmingElemental];

export class CardUpdatedInDeckParser implements ActionParser {
	readonly ParserName = 'CardUpdatedInDeckParser';

	private GameState: GameState;
	private ParserState: ParserState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, stateFacade: StateFacade) {
		this.ParserState = parserState;
		this.GameState = parserState.GameState;
		this.StateFacade = stateFacade;
	}

	AppliesOnNewNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	AppliesOnCloseNode(node: Node, stateType: StateType): boolean {
		const appliesOnShow =
			node.Type === NodeType.ShowEntity &&
			(node.Object as ShowEntity).GetTag(GameTag.ZONE) === (Zone.DECK as number) &&
			this.GameState.CurrentEntities.has((node.Object as ShowEntity).Entity) &&
			this.GameState.CurrentEntities.get((node.Object as ShowEntity).Entity)!.GetTag(GameTag.ZONE) ===
				(Zone.DECK as number);
		const appliesForAction =
			node.Type === NodeType.Action &&
			this.GameState.CurrentEntities.has((node.Object as Action).Entity) &&
			SPECIAL_CASE_CARD_IDS.includes(this.GameState.CurrentEntities.get((node.Object as Action).Entity)!.CardId);
		return stateType === StateType.PowerTaskList && (appliesOnShow || appliesForAction);
	}

	CreateGameEventProviderFromNew(_node: Node): GameEventProvider[] | null {
		return null;
	}

	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null {
		if (node.Type === NodeType.ShowEntity) {
			return this.createFromShowEntity(node);
		} else if (node.Type === NodeType.Action) {
			return this.createFromAction(node);
		}
		return null;
	}

	private createFromAction(node: Node): GameEventProvider[] | null {
		const action = node.Object as Action;
		const changedEntities = action.Data.filter((data): data is MetaData => data instanceof MetaData)
			.filter((meta) => meta.Meta === MetaDataType.HISTORY_TARGET)
			.flatMap((meta) => meta.MetaInfo);

		let eventName = 'CARD_CHANGED_IN_DECK';
		let parentEntity: FullEntity | undefined;
		if (this.ParserState.GameState.CurrentEntities.has(action.Entity)) {
			parentEntity = this.ParserState.GameState.CurrentEntities.get(action.Entity);
			if (parentEntity?.HasDredge()) {
				eventName = 'CARD_DREDGED';
			}
		}

		return changedEntities.map((info) => {
			const entityId = info.Entity;
			const entity = this.GameState.CurrentEntities.get(entityId)!;
			return GameEventProvider.Create(
				info.TimeStamp,
				eventName,
				GameEventHelper.CreateProvider(
					eventName,
					entity.CardId,
					entity.GetController(),
					entity.Id,
					this.StateFacade,
					{
						LastInfluencedByCardId: this.GameState.CurrentEntities.get((node.Object as Action).Entity)!
							.CardId,
					},
				),
				true,
				node,
			);
		});
	}

	private createFromShowEntity(node: Node): GameEventProvider[] | null {
		const showEntity = node.Object as ShowEntity;
		if (isIgnoredSpawnToDeckFxPrefab(showEntity.SubSpellInEffect?.Prefab)) {
			return null;
		}

		const cardId = showEntity.CardId;
		const isBeforeMulligan = this.GameState.GetGameEntity()?.GetTag(GameTag.NEXT_STEP) === -1;
		if (isBeforeMulligan && cardId === CardIds.EncumberedPackMule) {
			return null;
		}

		const entity = this.GameState.CurrentEntities.get(showEntity.Entity)!;
		const controllerId = entity.GetEffectiveController();

		const parentNode = node.Parent?.Object;
		if (parentNode?.constructor === Action) {
			const parentAction = node.Parent!.Object as Action;
			if (
				parentAction.Type === (BlockType.POWER as number) ||
				parentAction.Type === (BlockType.TRIGGER as number)
			) {
				const parentEntityId = parentAction.Entity;
				const parentEntity = this.GameState.CurrentEntities.get(parentEntityId)!;
				if (parentEntity.HasDredge()) {
					const lastAffectedByEntity = this.GameState.CurrentEntities.has(parentEntityId)
						? this.GameState.CurrentEntities.get(parentEntityId)!
						: null;
					return [
						GameEventProvider.Create(
							showEntity.TimeStamp,
							'CARD_DREDGED',
							GameEventHelper.CreateProvider(
								'CARD_DREDGED',
								cardId,
								controllerId,
								entity.Id,
								this.StateFacade,
								{
									DredgedByEntityId: parentEntityId,
									DredgedByCardId: lastAffectedByEntity?.CardId ?? null,
								},
							),
							true,
							node,
						),
					];
				}
			}
		}

		const creatorEntityId = showEntity.GetTag(GameTag.CREATOR);
		const creatorEntityCardId = this.GameState.CurrentEntities.has(creatorEntityId)
			? this.GameState.CurrentEntities.get(creatorEntityId)!.CardId
			: null;

		if (
			cardId === CardIds.PhotographerFizzle_FizzlesSnapshotToken &&
			entity != null &&
			entity.KnownEntityIds.length === 0
		) {
			entity.KnownEntityIds = [...this.GameState.CurrentEntities.values()]
				.filter((e) => e.GetController() === entity.GetController())
				.filter((e) => e.InHand())
				.sort((a, b) => a.GetZonePosition() - b.GetZonePosition())
				.map((e) => e.Entity);
		}
		return [
			GameEventProvider.Create(
				showEntity.TimeStamp,
				'CARD_CHANGED_IN_DECK',
				GameEventHelper.CreateProvider(
					'CARD_CHANGED_IN_DECK',
					cardId,
					controllerId,
					entity.Id,
					this.StateFacade,
					{
						CreatorCardId: creatorEntityCardId,
						SubSpell: showEntity.SubSpellInEffect?.Prefab ?? null,
					},
				),
				true,
				node,
			),
		];
	}
}
