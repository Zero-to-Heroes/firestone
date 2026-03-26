import { BlockType, CardType, GameTag } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider, GameEventHelper } from '../game-event';
import { Action, Node, NodeType } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class CounterTriggerParser implements ActionParser {
	readonly ParserName = 'CounterTriggerParser';

	private GameState: GameState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, stateFacade: StateFacade) {
		this.GameState = parserState.GameState;
		this.StateFacade = stateFacade;
	}

	AppliesOnNewNode(node: Node, stateType: StateType): boolean {
		return (
			stateType === StateType.PowerTaskList &&
			node.Type === NodeType.Action &&
			(node.Object as Action).Type === (BlockType.TRIGGER as number) &&
			(node.Object as Action).TriggerKeyword === (GameTag.COUNTER as number)
		);
	}

	AppliesOnCloseNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const action = node.Object as Action;
		const entity = this.GameState.CurrentEntities.get(action.Entity)!;
		const cardId = entity.CardId;
		const controllerId = entity.GetEffectiveController();
		if (
			this.GameState.CurrentEntities.get(action.Entity)!.GetTag(GameTag.CARDTYPE) ===
			(CardType.ENCHANTMENT as number)
		) {
			return null;
		}

		const parentAction = node.Parent?.Object as Action | null;
		let additionalProps: any = {};
		if (parentAction != null && parentAction.Type === (BlockType.PLAY as number)) {
			additionalProps = {
				InReactionToCardId: this.GameState.CurrentEntities.get(parentAction.Entity)?.CardId,
				InReactionToEntityId: parentAction.Entity,
			};
		}
		return [
			GameEventProvider.Create(
				action.TimeStamp,
				'COUNTER_TRIGGERED',
				GameEventHelper.CreateProvider(
					'COUNTER_TRIGGERED',
					cardId,
					controllerId,
					entity.Id,
					this.StateFacade,
					additionalProps,
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
