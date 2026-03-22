import { BlockType, CardIds, GameTag, Zone } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventHelper, GameEventProvider } from '../game-event';
import { Action, FullEntity, Node, ShowEntity } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

// TODO: Oracle
const Oracle = {
	FindCardCreator(
		_gameState: GameState,
		_entity: FullEntity,
		_node: Node,
		_recurse?: boolean,
		_stateFacade?: StateFacade,
	): [string, number] | null {
		return null;
	},
	FindCardCreatorCardId(
		_gameState: GameState,
		_entity: ShowEntity,
		_node: Node,
	): [string, number] | null {
		return null;
	},
	PredictCardId(
		_gameState: GameState,
		_creatorCardId: string | null | undefined,
		_creatorEntityId: number,
		_node: Node,
		_cardId: string | null,
		_stateFacade?: StateFacade,
		_targetEntityId?: number,
	): string | null {
		return null;
	},
};

export class CreateCardInDeckParser implements ActionParser {
	readonly ParserName = 'CreateCardInDeckParser';

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
		const appliesOnShowEntity =
			node.Type === ShowEntity &&
			(node.Object as ShowEntity).GetTag(GameTag.ZONE) === (Zone.DECK as number);
		const appliesOnFullEntity =
			node.Type === FullEntity &&
			(node.Object as FullEntity).GetTag(GameTag.ZONE) === (Zone.DECK as number) &&
			node.Parent!.Type === Action;
		return stateType === StateType.PowerTaskList && (appliesOnShowEntity || appliesOnFullEntity);
	}

	CreateGameEventProviderFromNew(_node: Node): GameEventProvider[] | null {
		return null;
	}

	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null {
		if (node.Type === ShowEntity) {
			return this.createFromShowEntity(node);
		} else if (node.Type === FullEntity) {
			return this.createFromFullEntity(node);
		}
		return null;
	}

	private createFromShowEntity(node: Node): GameEventProvider[] | null {
		const showEntity = node.Object as ShowEntity;
		if (
			showEntity.SubSpellInEffect?.Prefab ===
			'DMFFX_SpawnToDeck_CthunTheShattered_CardFromScript_FX'
		) {
			return null;
		}

		const currentCard = this.GameState.CurrentEntities.get(showEntity.Entity)!;
		if (currentCard.GetTag(GameTag.ZONE) === (Zone.DECK as number)) {
			return null;
		}

		const creator = Oracle.FindCardCreatorCardId(this.GameState, showEntity, node);
		let cardId = Oracle.PredictCardId(
			this.GameState,
			creator?.[0] ?? null,
			creator?.[1] ?? -1,
			node,
			showEntity.CardId,
		);
		const controllerId = showEntity.GetEffectiveController();
		if (node.Parent?.Object instanceof Action) {
			const parentAction = node.Parent.Object as Action;
			const parentEntity = this.GameState.CurrentEntities.get(parentAction.Entity);
			if (parentEntity?.CardId === CardIds.Kiljaeden_KiljaedensPortalEnchantment_GDB_145e) {
				cardId = null;
			}
		}

		return [
			GameEventProvider.Create(
				showEntity.TimeStamp,
				'CREATE_CARD_IN_DECK',
				GameEventHelper.CreateProvider(
					'CREATE_CARD_IN_DECK',
					cardId ?? (null as any),
					controllerId,
					showEntity.Entity,
					this.StateFacade,
					{
						CreatorCardId: creator?.[0] ?? null,
						CreatorEntityId: creator?.[1] ?? -1,
						FxDataNum1: showEntity.GetTag(GameTag.FX_DATANUM_1),
					},
				),
				true,
				node,
			),
		];
	}

	private createFromFullEntity(node: Node): GameEventProvider[] | null {
		const fullEntity = node.Object as FullEntity;
		if (
			fullEntity.SubSpellInEffect?.Prefab ===
			'DMFFX_SpawnToDeck_CthunTheShattered_CardFromScript_FX'
		) {
			return null;
		}

		const parentAction = node.Parent?.Object as Action | undefined;
		const createdByJoust = parentAction?.Type === (BlockType.JOUST as number);

		let creator = Oracle.FindCardCreator(this.GameState, fullEntity, node, true, this.StateFacade);
		if (creator?.[0] === CardIds.DarkGiftToken_EDR_102t) {
			const futureEntity = this.StateFacade.GsState?.GameState.CurrentEntities.get(fullEntity.Id);
			if (futureEntity != null) {
				const realGiftCreatorEntityId =
					[...futureEntity.TagsHistory]
						.reverse()
						.find(
							(t) =>
								t.Name === (GameTag.TAG_SCRIPT_DATA_ENT_1 as number) && t.Value > 0,
						)?.Value ?? 0;
				const realGiftCreator =
					this.StateFacade.GsState?.GameState.CurrentEntities.get(realGiftCreatorEntityId);
				if (realGiftCreator != null) {
					creator = [realGiftCreator.CardId, realGiftCreatorEntityId];
				}
			}
		}
		let cardId = Oracle.PredictCardId(
			this.GameState,
			creator?.[0],
			creator?.[1] ?? -1,
			node,
			fullEntity.CardId,
			this.StateFacade,
			fullEntity.Entity,
		);
		if (creator?.[0] === CardIds.Kiljaeden_GDB_145) {
			return null;
		}

		if (cardId == null) {
			cardId =
				this.StateFacade.GsState?.GameState.CurrentEntities.get(fullEntity.Id)?.CardId ?? null;
		}
		const controllerId = fullEntity.GetEffectiveController();

		return [
			GameEventProvider.Create(
				fullEntity.TimeStamp,
				'CREATE_CARD_IN_DECK',
				GameEventHelper.CreateProvider(
					'CREATE_CARD_IN_DECK',
					cardId ?? (null as any),
					controllerId,
					fullEntity.Id,
					this.StateFacade,
					{
						CreatorCardId: creator?.[0] ?? null,
						CreatorEntityId: creator?.[1] ?? -1,
						CreatedByJoust: createdByJoust,
						FxDataNum1: fullEntity.GetTag(GameTag.FX_DATANUM_1),
					},
				),
				true,
				node,
			),
		];
	}
}
