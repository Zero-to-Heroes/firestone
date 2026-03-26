import { CardType, GameTag, Zone } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider, GameEventHelper } from '../game-event';
import { FullEntity, Node, NodeType, ShowEntity, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class WeaponEquippedParser implements ActionParser {
	readonly ParserName = 'WeaponEquippedParser';

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
			(node.Object as TagChange).Value === (Zone.PLAY as number) &&
			this.GameState.CurrentEntities.has((node.Object as TagChange).Entity) &&
			this.GameState.CurrentEntities.get((node.Object as TagChange).Entity)!.GetTag(GameTag.CARDTYPE) ===
				(CardType.WEAPON as number)
		);
	}

	AppliesOnCloseNode(node: Node, stateType: StateType): boolean {
		const fullEntity =
			stateType === StateType.PowerTaskList &&
			node.Type === NodeType.FullEntity &&
			(node.Object as FullEntity).GetTag(GameTag.ZONE) === (Zone.PLAY as number) &&
			(node.Object as FullEntity).GetTag(GameTag.CARDTYPE) === (CardType.WEAPON as number);
		const showEntity =
			stateType === StateType.PowerTaskList &&
			node.Type === NodeType.ShowEntity &&
			(node.Object as ShowEntity).GetTag(GameTag.ZONE) === (Zone.PLAY as number) &&
			(node.Object as ShowEntity).GetTag(GameTag.CARDTYPE) === (CardType.WEAPON as number);
		return fullEntity || showEntity;
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
		return [
			GameEventProvider.Create(
				tagChange.TimeStamp,
				'WEAPON_EQUIPPED',
				GameEventHelper.CreateProvider('WEAPON_EQUIPPED', cardId, controllerId, entity.Id, this.StateFacade, {
					CreatorCardId: creatorEntityCardId,
				}),
				true,
				node,
			),
		];
	}

	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null {
		if (node.Object instanceof FullEntity) {
			return this.createFromFullEntity(node);
		} else {
			return this.createFromShowEntity(node);
		}
	}

	private createFromFullEntity(node: Node): GameEventProvider[] | null {
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
				'WEAPON_EQUIPPED',
				GameEventHelper.CreateProvider('WEAPON_EQUIPPED', cardId, controllerId, fullEntity.Id, this.StateFacade, {
					CreatorCardId: creatorEntityCardId,
				}),
				true,
				node,
			),
		];
	}

	private createFromShowEntity(node: Node): GameEventProvider[] | null {
		const showEntity = node.Object as ShowEntity;
		const cardId = showEntity.CardId;
		const controllerId = showEntity.GetEffectiveController();
		const creatorEntityId = showEntity.GetTag(GameTag.CREATOR);
		const creatorEntityCardId = this.GameState.CurrentEntities.has(creatorEntityId)
			? this.GameState.CurrentEntities.get(creatorEntityId)!.CardId
			: null;
		return [
			GameEventProvider.Create(
				showEntity.TimeStamp,
				'WEAPON_EQUIPPED',
				GameEventHelper.CreateProvider(
					'WEAPON_EQUIPPED',
					cardId,
					controllerId,
					showEntity.Entity,
					this.StateFacade,
					{
						CreatorCardId: creatorEntityCardId,
					},
				),
				true,
				node,
			),
		];
	}
}
