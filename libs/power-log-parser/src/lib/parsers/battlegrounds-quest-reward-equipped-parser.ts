import { CardType, GameTag, Zone } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventHelper, GameEventProvider } from '../game-event';
import { FullEntity, Node, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class BattlegroundsQuestRewardEquippedParser implements ActionParser {
	readonly ParserName = 'BattlegroundsQuestRewardEquippedParser';

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
			(node.Object as TagChange).Value === (Zone.PLAY as number) &&
			this.GameState.CurrentEntities.has((node.Object as TagChange).Entity) &&
			this.GameState.CurrentEntities.get((node.Object as TagChange).Entity)!.GetTag(
				GameTag.CARDTYPE,
			) === (CardType.BATTLEGROUND_QUEST_REWARD as number)
		);
	}

	AppliesOnCloseNode(node: Node, stateType: StateType): boolean {
		return (
			stateType === StateType.PowerTaskList &&
			node.Type === FullEntity &&
			(node.Object as FullEntity).GetTag(GameTag.ZONE) === (Zone.PLAY as number) &&
			(node.Object as FullEntity).GetTag(GameTag.CARDTYPE) ===
				(CardType.BATTLEGROUND_QUEST_REWARD as number)
		);
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const tagChange = node.Object as TagChange;
		const entity = this.GameState.CurrentEntities.get(tagChange.Entity);
		if (entity == null) {
			return null;
		}

		const cardId = entity.CardId;
		const controllerId = entity.GetEffectiveController();
		const isHeroPowerReward = entity.GetTag(GameTag.BACON_IS_HEROPOWER_QUESTREWARD) === 1;
		return [
			GameEventProvider.Create(
				tagChange.TimeStamp,
				'BATTLEGROUNDS_QUEST_REWARD_EQUIPPED',
				GameEventHelper.CreateProvider(
					'BATTLEGROUNDS_QUEST_REWARD_EQUIPPED',
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

	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null {
		const fullEntity = node.Object as FullEntity;
		const cardId = fullEntity.CardId;
		const controllerId = fullEntity.GetEffectiveController();
		const isHeroPowerReward = fullEntity.GetTag(GameTag.BACON_IS_HEROPOWER_QUESTREWARD) === 1;
		return [
			GameEventProvider.Create(
				fullEntity.TimeStamp,
				'BATTLEGROUNDS_QUEST_REWARD_EQUIPPED',
				GameEventHelper.CreateProvider(
					'BATTLEGROUNDS_QUEST_REWARD_EQUIPPED',
					cardId,
					controllerId,
					fullEntity.Id,
					this.StateFacade,
					{
						PlayerId: fullEntity.GetTag(GameTag.PLAYER_ID),
						IsHeroPowerReward: isHeroPowerReward,
					},
				),
				true,
				node,
			),
		];
	}
}
