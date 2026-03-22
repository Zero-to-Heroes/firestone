import { GameTag, Zone } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider, GameEventHelper } from '../game-event';
import { Action, ChangeEntity, Node } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class CardChangedParser implements ActionParser {
	readonly ParserName = 'CardChangedParser';

	private GameState: GameState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, stateFacade: StateFacade) {
		this.GameState = parserState.GameState;
		this.StateFacade = stateFacade;
	}

	AppliesOnNewNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	AppliesOnCloseNode(node: Node, stateType: StateType): boolean {
		return stateType === StateType.PowerTaskList && node.Type === ChangeEntity;
	}

	CreateGameEventProviderFromNew(_node: Node): GameEventProvider[] | null {
		return null;
	}

	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null {
		const changeEntity = node.Object as ChangeEntity;
		let eventName: string | null = null;
		if (this.GameState.CurrentEntities.get(changeEntity.Entity)!.GetTag(GameTag.ZONE) === (Zone.PLAY as number)) {
			eventName = 'CARD_CHANGED_ON_BOARD';
		} else if (
			this.GameState.CurrentEntities.get(changeEntity.Entity)!.GetTag(GameTag.ZONE) === (Zone.HAND as number)
		) {
			eventName = 'CARD_CHANGED_IN_HAND';
		} else if (
			this.GameState.CurrentEntities.get(changeEntity.Entity)!.GetTag(GameTag.ZONE) === (Zone.DECK as number)
		) {
			eventName = 'CARD_CHANGED_IN_DECK';
		}
		if (eventName == null) {
			return null;
		}
		const cardId = changeEntity.CardId;
		const entity = this.GameState.CurrentEntities.get(changeEntity.Entity)!;
		const controllerId = entity.GetEffectiveController();
		const creatorEntityId = changeEntity.GetTag(GameTag.CREATOR);
		const creatorEntityCardId = this.GameState.CurrentEntities.has(creatorEntityId)
			? this.GameState.CurrentEntities.get(creatorEntityId)!.CardId
			: null;
		let lastInfluencedByEntityId: number | null = null;
		let lastAffectedByCardId: string | null = null;
		if (node.Parent != null && node.Parent.Type === Action) {
			const parent = node.Parent.Object as Action;
			lastInfluencedByEntityId = parent?.Entity ?? null;
			lastAffectedByCardId =
				this.GameState.CurrentEntities.get(lastInfluencedByEntityId ?? 0)?.CardId ?? null;
		}
		return [
			GameEventProvider.Create(
				changeEntity.TimeStamp,
				eventName,
				GameEventHelper.CreateProvider(eventName, cardId, controllerId, entity.Id, this.StateFacade, {
					CreatorCardId: creatorEntityCardId,
					LastAffectedByEntityId: lastInfluencedByEntityId,
					LastAffectedByCardId: lastAffectedByCardId,
					Tags: entity.GetTagsCopy(),
				}),
				true,
				node,
			),
		];
	}
}
