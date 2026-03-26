import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider, GameEventHelper } from '../game-event';
import { Choices, Node, NodeType } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class ChoosingOptionsParser implements ActionParser {
	readonly ParserName = 'ChoosingOptionsParser';

	private GameState: GameState;
	private ParserState: ParserState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, stateFacade: StateFacade) {
		this.ParserState = parserState;
		this.GameState = parserState.GameState;
		this.StateFacade = stateFacade;
	}

	AppliesOnNewNode(node: Node, _stateType: StateType): boolean {
		return node.Type === NodeType.Choices && this.ParserState.Choices != null;
	}

	AppliesOnCloseNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const choices = node.Object as Choices;
		let sourceEntity = this.GameState.CurrentEntities.get(choices.Source);
		if (sourceEntity == null) {
			return null;
		}

		const isDarkGift = sourceEntity.CardId === CardIds.DarkGiftToken_EDR_102t;
		if (isDarkGift) {
			const creatorEntityId = sourceEntity.GetTag(GameTag.CREATOR);
			const creatorEntity = this.GameState.CurrentEntities.get(creatorEntityId);
			if (creatorEntity != null) {
				sourceEntity = creatorEntity;
			}
		}

		const controllerId = sourceEntity.GetEffectiveController();
		const options = choices.ChoiceList?.map((c) => {
			let optionEntity = this.GameState.CurrentEntities.get(c.Entity);
			if (isDarkGift && optionEntity && optionEntity.GetTag(GameTag.TAG_SCRIPT_DATA_ENT_1) !== -1) {
				const referencedEntity = this.GameState.CurrentEntities.get(
					optionEntity.GetTag(GameTag.TAG_SCRIPT_DATA_ENT_1),
				);
				if (referencedEntity != null) {
					optionEntity = referencedEntity;
				}
			}
			const rewardEntityId = optionEntity?.GetTag(GameTag.TAG_SCRIPT_DATA_ENT_1) ?? -1;
			const rewardEntity = this.GameState.CurrentEntities.get(rewardEntityId);
			return {
				EntityId: c.Entity,
				CardId: optionEntity?.CardId,
				QuestDifficulty: optionEntity?.GetTag(GameTag.QUEST_PROGRESS_TOTAL) ?? 0,
				QuestReward: {
					EntityId: rewardEntityId,
					CardId: rewardEntity?.CardId,
				},
			};
		});
		if (options == null || options.length === 0) {
			return null;
		}

		return [
			GameEventProvider.Create(
				choices.TimeStamp,
				'CHOOSING_OPTIONS',
				GameEventHelper.CreateProvider(
					'CHOOSING_OPTIONS',
					sourceEntity.CardId,
					controllerId,
					sourceEntity.Id,
					this.StateFacade,
					{
						Options: options,
						Context: {
							DataNum1: sourceEntity.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_1),
						},
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
