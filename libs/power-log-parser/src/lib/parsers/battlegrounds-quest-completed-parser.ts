import { GameTag } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventHelper, GameEventProvider } from '../game-event';
import { Node, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class BattlegroundsQuestCompletedParser implements ActionParser {
	readonly ParserName = 'BattlegroundsQuestCompletedParser';

	private GameState: GameState;
	private ParserState: ParserState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, facade: StateFacade) {
		this.ParserState = parserState;
		this.GameState = parserState.GameState;
		this.StateFacade = facade;
	}

	AppliesOnNewNode(node: Node, stateType: StateType): boolean {
		return (
			stateType === StateType.PowerTaskList &&
			node.Type === TagChange &&
			(node.Object as TagChange).Name === (GameTag.BACON_QUEST_COMPLETED as number) &&
			(node.Object as TagChange).Value === 1
		);
	}

	AppliesOnCloseNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const tagChange = node.Object as TagChange;
		const entity = this.GameState.CurrentEntities.get(tagChange.Entity)!;
		const controllerId = entity.GetEffectiveController();
		const isHeroPowerReward = entity.GetTag(GameTag.BACON_IS_HEROPOWER_QUESTREWARD) === 1;
		return [
			GameEventProvider.Create(
				tagChange.TimeStamp,
				'BATTLEGROUNDS_QUEST_COMPLETED',
				GameEventHelper.CreateProvider(
					'BATTLEGROUNDS_QUEST_COMPLETED',
					null as any,
					controllerId,
					entity.Id,
					this.StateFacade,
					{
						IsHeroPowerReward: isHeroPowerReward,
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
