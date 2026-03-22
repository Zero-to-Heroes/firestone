import { GameTag, Zone } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider, GameEventHelper } from '../game-event';
import { Action, Node, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

const CastWhenDrawnTransformers: string[] = [];

export class CardRemovedFromHandParser implements ActionParser {
	readonly ParserName = 'CardRemovedFromHandParser';

	private GameState: GameState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, stateFacade: StateFacade) {
		this.GameState = parserState.GameState;
		this.StateFacade = stateFacade;
	}

	AppliesOnNewNode(node: Node, stateType: StateType): boolean {
		return (
			stateType === StateType.PowerTaskList &&
			node.Type === TagChange &&
			(node.Object as TagChange).Name === (GameTag.ZONE as number) &&
			(node.Object as TagChange).Value === (Zone.SETASIDE as number)
		);
	}

	AppliesOnCloseNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const tagChange = node.Object as TagChange;
		const entity = this.GameState.CurrentEntities.get(tagChange.Entity)!;
		const zoneInt = entity.GetTag(GameTag.ZONE) === -1 ? 0 : entity.GetTag(GameTag.ZONE);
		if (zoneInt !== (Zone.HAND as number)) {
			return null;
		}

		const isEcho =
			(entity.GetTag(GameTag.NON_KEYWORD_ECHO) === 1 || entity.GetTag(GameTag.ECHO) === 1) &&
			entity.GetTag(GameTag.GHOSTLY) === 1;
		if (isEcho) {
			return null;
		}

		let cardId: string | null = entity.CardId;
		const controllerId = entity.GetEffectiveController();
		entity.PlayedWhileInHand.length = 0;
		if (entity.IsImmolateDiscard()) {
			cardId = null;
		}

		if (entity.GetTag(GameTag.CASTS_WHEN_DRAWN) === 1 || entity.GetTag(GameTag.SUMMONED_WHEN_DRAWN) === 1) {
			return null;
		}

		let removedByCardId: string | null = null;
		let removedByEntityId: number | null = null;
		if (node.Parent?.Type === Action) {
			const act = node.Parent.Object as Action;
			removedByCardId = this.GameState.CurrentEntities.get(act.Entity)?.CardId ?? null;
			removedByEntityId = act.Entity;
		}

		if (CastWhenDrawnTransformers.includes(removedByCardId!)) {
			return null;
		}

		return [
			GameEventProvider.Create(
				tagChange.TimeStamp,
				'CARD_REMOVED_FROM_HAND',
				GameEventHelper.CreateProvider(
					'CARD_REMOVED_FROM_HAND',
					cardId as any,
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

	CreateGameEventProviderFromClose(_node: Node): GameEventProvider[] | null {
		return null;
	}
}
