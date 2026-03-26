import { BlockType, CardType, GameTag } from '@firestone-hs/reference-data';
import { ParserGameTag } from '../enums';
import { ActionParser } from '../action-parser';
import { GameEventProvider, GameEventHelper } from '../game-event';
import { Action, Node, NodeType } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class QuestCompletedParser implements ActionParser {
	readonly ParserName = 'QuestCompletedParser';

	private GameState: GameState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, stateFacade: StateFacade) {
		this.GameState = parserState.GameState;
		this.StateFacade = stateFacade;
	}

	AppliesOnNewNode(node: Node, stateType: StateType): boolean {
		if (stateType !== StateType.PowerTaskList || node.Type !== NodeType.Action) {
			return false;
		}
		const action = node.Object as Action;
		return (
			action.Type === (BlockType.TRIGGER as number) &&
			(action.TriggerKeyword === (GameTag.SIDE_QUEST as number) ||
				action.TriggerKeyword === (GameTag.QUEST as number))
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
			this.GameState.CurrentEntities.get(action.Entity)!.GetTag(GameTag.CARDTYPE) !==
			(CardType.ENCHANTMENT as number)
		) {
			entity.SetTag(ParserGameTag.SECRET_HAS_TRIGGERED, 1);
			return [
				GameEventProvider.Create(
					action.TimeStamp,
					'QUEST_COMPLETED',
					GameEventHelper.CreateProvider(
						'QUEST_COMPLETED',
						cardId,
						controllerId,
						entity.Id,
						this.StateFacade,
					),
					true,
					node,
				),
			];
		}
		return null;
	}

	CreateGameEventProviderFromClose(_node: Node): GameEventProvider[] | null {
		return null;
	}
}
