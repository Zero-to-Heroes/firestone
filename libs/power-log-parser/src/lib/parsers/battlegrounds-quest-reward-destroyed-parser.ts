import { CardType, GameTag, Zone } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventHelper, GameEventProvider } from '../game-event';
import { Node, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class BattlegroundsQuestRewardDestroyedParser implements ActionParser {
	readonly ParserName = 'BattlegroundsQuestRewardDestroyedParser';

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
			(node.Object as TagChange).Name === (GameTag.ZONE as number) &&
			(node.Object as TagChange).Value === (Zone.REMOVEDFROMGAME as number) &&
			this.GameState.CurrentEntities.get((node.Object as TagChange).Entity)?.GetTag(
				GameTag.CARDTYPE,
			) === (CardType.BATTLEGROUND_QUEST_REWARD as number) &&
			this.GameState.CurrentEntities.get((node.Object as TagChange).Entity)?.GetTag(
				GameTag.ZONE,
			) === (Zone.PLAY as number)
		);
	}

	AppliesOnCloseNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const tagChange = node.Object as TagChange;
		const entity = this.GameState.CurrentEntities.get(tagChange.Entity)!;
		const cardId = entity.CardId;
		const controllerId = entity.GetEffectiveController();
		const isHeroPowerReward = entity.GetTag(GameTag.BACON_IS_HEROPOWER_QUESTREWARD) === 1;
		return [
			GameEventProvider.Create(
				tagChange.TimeStamp,
				'BATTLEGROUNDS_QUEST_REWARD_DESTROYED',
				GameEventHelper.CreateProvider(
					'BATTLEGROUNDS_QUEST_REWARD_DESTROYED',
					cardId,
					controllerId,
					entity.Id,
					this.StateFacade,
					{
						PlayerId: entity.GetTag(GameTag.PLAYER_ID),
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
