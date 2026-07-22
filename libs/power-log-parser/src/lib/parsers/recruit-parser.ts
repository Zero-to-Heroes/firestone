import { CardType, GameTag, Zone } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider, GameEventHelper } from '../game-event';
import { Node, NodeType, ShowEntity, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class RecruitParser implements ActionParser {
	readonly ParserName = 'RecruitParser';

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
			(node.Object as TagChange).Name === (GameTag.ZONE as number) &&
			(node.Object as TagChange).Value === (Zone.PLAY as number) &&
			this.GameState.CurrentEntities.get((node.Object as TagChange).Entity)!.GetTag(GameTag.ZONE) ===
				(Zone.DECK as number)
		);
	}

	AppliesOnCloseNode(node: Node, stateType: StateType): boolean {
		const appliesToShowEntity =
			node.Type === NodeType.ShowEntity &&
			(node.Object as ShowEntity).GetTag(GameTag.ZONE) === (Zone.PLAY as number) &&
			this.GameState.CurrentEntities.has((node.Object as ShowEntity).Entity) &&
			this.GameState.CurrentEntities.get((node.Object as ShowEntity).Entity)!.GetTag(GameTag.ZONE) ===
				(Zone.DECK as number);
		return stateType === StateType.PowerTaskList && appliesToShowEntity;
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
			const { creatorEntityId, creatorCardId } = this.resolveCreator(entity.GetTag(GameTag.CREATOR, 0));
			return [
				GameEventProvider.Create(
					tagChange.TimeStamp,
					'RECRUIT_CARD',
					GameEventHelper.CreateProvider('RECRUIT_CARD', cardId, controllerId, entity.Id, this.StateFacade, {
						Tags: entity.Tags,
						CreatorCardId: creatorCardId,
						CreatorEntityId: creatorEntityId,
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
		const controllerId = showEntity.GetEffectiveController();
		const { creatorEntityId, creatorCardId } = this.resolveCreator(showEntity.GetTag(GameTag.CREATOR, 0));
		return [
			GameEventProvider.Create(
				showEntity.TimeStamp,
				'RECRUIT_CARD',
				GameEventHelper.CreateProvider(
					'RECRUIT_CARD',
					cardId,
					controllerId,
					showEntity.Entity,
					this.StateFacade,
					{
						Tags: showEntity.Tags,
						CreatorCardId: creatorCardId,
						CreatorEntityId: creatorEntityId,
					},
				),
				true,
				node,
			),
		];
	}

	private resolveCreator(creatorEntityIdRaw: number): {
		creatorEntityId: number | null;
		creatorCardId: string | null;
	} {
		const creatorEntityId = creatorEntityIdRaw ? creatorEntityIdRaw : null;
		const creatorCardId =
			creatorEntityId !== null && this.GameState.CurrentEntities.has(creatorEntityId)
				? this.GameState.CurrentEntities.get(creatorEntityId)!.CardId
				: null;
		return { creatorEntityId, creatorCardId };
	}
}
