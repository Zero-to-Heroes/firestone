import { GameTag } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventHelper, GameEventProvider } from '../game-event';
import { Node, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class BattlegroundsRewardGainedParser implements ActionParser {
	readonly ParserName = 'BattlegroundsRewardGainedParser';

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
			this.StateFacade.IsBattlegrounds() &&
			node.Type === TagChange &&
			((node.Object as TagChange).Name === (GameTag.BACON_HERO_QUEST_REWARD_COMPLETED as number) ||
				(node.Object as TagChange).Name === (GameTag.BACON_HERO_HEROPOWER_QUEST_REWARD_COMPLETED as number))
		);
	}

	AppliesOnCloseNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const tagChange = node.Object as TagChange;
		const hero = this.GameState.CurrentEntities.get(tagChange.Entity);
		if (hero?.CardId == null) {
			return null;
		}

		const isHeroPowerReward =
			tagChange.Name === (GameTag.BACON_HERO_HEROPOWER_QUEST_REWARD_COMPLETED as number);
		const questRewardDbfId = isHeroPowerReward
			? hero.GetTag(GameTag.BACON_HERO_HEROPOWER_QUEST_REWARD_DATABASE_ID)
			: hero.GetTag(GameTag.BACON_HERO_QUEST_REWARD_DATABASE_ID);

		const controllerId = hero.GetEffectiveController();
		return [
			GameEventProvider.Create(
				tagChange.TimeStamp,
				'BATTLEGROUNDS_REWARD_GAINED',
				GameEventHelper.CreateProvider(
					'BATTLEGROUNDS_REWARD_GAINED',
					hero.CardId,
					controllerId,
					hero.Entity,
					this.StateFacade,
					{
						PlayerId: hero.GetTag(GameTag.PLAYER_ID),
						QuestRewardDbfId: questRewardDbfId,
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
