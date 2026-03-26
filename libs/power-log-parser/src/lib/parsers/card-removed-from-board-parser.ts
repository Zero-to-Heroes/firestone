import { GameTag, Zone } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider, GameEventHelper } from '../game-event';
import { Action, Node, NodeType, TagChange } from '../models';
import { Logger } from '../logger';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class CardRemovedFromBoardParser implements ActionParser {
	readonly ParserName = 'CardRemovedFromBoardParser';

	private GameState: GameState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, stateFacade: StateFacade) {
		this.GameState = parserState.GameState;
		this.StateFacade = stateFacade;
	}

	AppliesOnNewNode(node: Node, stateType: StateType): boolean {
		const normalRemovedMinion =
			stateType === StateType.PowerTaskList &&
			node.Type === NodeType.TagChange &&
			(node.Object as TagChange).Name === (GameTag.ZONE as number) &&
			((node.Object as TagChange).Value === (Zone.REMOVEDFROMGAME as number) ||
				(node.Object as TagChange).Value === (Zone.SETASIDE as number));
		const timewarpedTavernEnd =
			stateType === StateType.PowerTaskList &&
			node.Type === NodeType.TagChange &&
			(node.Object as TagChange).Name === (GameTag.BACON_ALT_TAVERN_IN_PROGRESS as number) &&
			(node.Object as TagChange).Value === 0;
		return normalRemovedMinion || timewarpedTavernEnd;
	}

	AppliesOnCloseNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const tagChange = node.Object as TagChange;
		if (tagChange.Name === (GameTag.BACON_ALT_TAVERN_IN_PROGRESS as number)) {
			const gameEventProviders: GameEventProvider[] = [];
			for (const entity of this.GameState.CurrentEntities.values()) {
				if (
					entity.IsMinionLike() &&
					entity.GetTag(GameTag.ZONE) === (Zone.SETASIDE as number) &&
					entity.GetTag(GameTag.BACON_TIMEWARPED) === 1
				) {
					const cardId = entity.CardId;
					const controllerId = entity.GetEffectiveController();
					gameEventProviders.push(
						GameEventProvider.Create(
							tagChange.TimeStamp,
							'CARD_REMOVED_FROM_BOARD',
							GameEventHelper.CreateProvider(
								'CARD_REMOVED_FROM_BOARD',
								cardId,
								controllerId,
								entity.Id,
								this.StateFacade,
								{
									RemovedByCardId: null as any,
									RemovedByEntityId: null as any,
								},
							),
							true,
							node,
						),
					);
				}
			}
			return gameEventProviders;
		} else {
			if (!this.GameState.CurrentEntities.has(tagChange.Entity)) {
				Logger.Log('Could not find card to remove from board', node.CreationLogLine);
				return null;
			}
			const entity = this.GameState.CurrentEntities.get(tagChange.Entity)!;
			if (!entity.IsMinionLike()) {
				return null;
			}
			if (entity.GetTag(GameTag.ZONE) !== (Zone.PLAY as number)) {
				return null;
			}

			let removedByCardId: string | null = null;
			let removedByEntityId: number | null = null;
			if (node.Parent?.Type === NodeType.Action) {
				const parentAction = node.Parent.Object as Action;
				const parentEntity = this.GameState.CurrentEntities.get(parentAction.Entity);
				removedByCardId = parentEntity?.CardId ?? null;
				removedByEntityId = parentEntity?.Entity ?? null;
			}

			const cardId = entity.CardId;
			const controllerId = entity.GetEffectiveController();

			return [
				GameEventProvider.Create(
					tagChange.TimeStamp,
					'CARD_REMOVED_FROM_BOARD',
					GameEventHelper.CreateProvider(
						'CARD_REMOVED_FROM_BOARD',
						cardId,
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
	}

	CreateGameEventProviderFromClose(_node: Node): GameEventProvider[] | null {
		return null;
	}
}
