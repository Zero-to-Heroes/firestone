import { GameTag, Zone } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventHelper, GameEventProvider } from '../game-event';
import { Logger } from '../logger';
import { Action, FullEntity, Node, NodeType, ShowEntity, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class DiscardedCardParser implements ActionParser {
	readonly ParserName = 'DiscardedCardParser';

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
			(node.Object as TagChange).Value === (Zone.GRAVEYARD as number) &&
			this.GameState.CurrentEntities.get((node.Object as TagChange).Entity)?.GetTag(GameTag.ZONE) ===
				(Zone.HAND as number)
		);
	}

	AppliesOnCloseNode(node: Node, _stateType: StateType): boolean {
		return (
			node.Type === NodeType.ShowEntity &&
			(node.Object as ShowEntity).GetTag(GameTag.ZONE) === (Zone.GRAVEYARD as number) &&
			this.GameState.CurrentEntities.get((node.Object as ShowEntity).Entity)?.GetTag(GameTag.ZONE) ===
				(Zone.HAND as number)
		);
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const tagChange = node.Object as TagChange;
		const entity = this.GameState.CurrentEntities.get(tagChange.Entity)!;
		const cardId = entity.CardId;
		const controllerId = entity.GetEffectiveController();
		entity.PlayedWhileInHand.length = 0;
		this.GameState.OnCardDiscarded(entity.Id, entity.CardId, null);
		return [
			GameEventProvider.Create(
				tagChange.TimeStamp,
				'DISCARD_CARD',
				GameEventHelper.CreateProvider('DISCARD_CARD', cardId, controllerId, entity.Id, this.StateFacade),
				true,
				node,
			),
		];
	}

	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null {
		const showEntity = node.Object as ShowEntity;
		const entity = this.GameState.CurrentEntities.get(showEntity.Entity);
		if (entity == null) {
			Logger.Log('Could not find entity while looking for discard', showEntity.Entity);
		}
		const cardId =
			entity?.CardId != null && entity.CardId.length > 0 ? entity.CardId : showEntity.CardId;
		const controllerId = entity != null ? entity.GetEffectiveController() : -1;
		entity?.PlayedWhileInHand.splice(0);

		let parentEntity: FullEntity | undefined;
		if (node.Parent?.Object instanceof Action) {
			const parentAction = node.Parent.Object as Action;
			parentEntity = this.GameState.CurrentEntities.get(parentAction.Entity);
		}
		this.GameState.OnCardDiscarded(entity?.Id ?? showEntity.Entity, cardId, parentEntity ?? null);
		return [
			GameEventProvider.Create(
				showEntity.TimeStamp,
				'DISCARD_CARD',
				GameEventHelper.CreateProvider(
					'DISCARD_CARD',
					cardId,
					controllerId,
					showEntity.Entity,
					this.StateFacade,
					{
						OriginEntityId: parentEntity?.Id ?? null,
					},
				),
				true,
				node,
			),
		];
	}
}
