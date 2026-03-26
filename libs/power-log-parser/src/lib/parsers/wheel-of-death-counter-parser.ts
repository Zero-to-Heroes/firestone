import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventHelper, GameEventProvider } from '../game-event';
import { Node, NodeType, ShowEntity, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class WheelOfDeathCounterParser implements ActionParser {
	readonly ParserName = 'WheelOfDeathCounterParser';

	private GameState: GameState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, stateFacade: StateFacade) {
		this.GameState = parserState.GameState;
		this.StateFacade = stateFacade;
	}

	AppliesOnNewNode(node: Node, stateType: StateType): boolean {
		let tagChange: TagChange | null = null;
		return (
			stateType === StateType.PowerTaskList &&
			node.Type === NodeType.TagChange &&
			(tagChange = node.Object as TagChange).Name === (GameTag.TAG_SCRIPT_DATA_NUM_1 as number) &&
			this.GameState.CurrentEntities.get(tagChange.Entity)?.CardId ===
				CardIds.WheelOfDeath_WheelOfDeathCounterEnchantment_TOY_529e1
		);
	}

	AppliesOnCloseNode(node: Node, stateType: StateType): boolean {
		return (
			stateType === StateType.PowerTaskList &&
			node.Type === NodeType.ShowEntity &&
			(node.Object as ShowEntity).CardId === CardIds.WheelOfDeath_WheelOfDeathCounterEnchantment_TOY_529e1
		);
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const tagChange = node.Object as TagChange;
		const entity = this.GameState.CurrentEntities.get(tagChange.Entity)!;
		const controllerId = entity.GetEffectiveController();
		const turnsBeforeControllerDies = tagChange.Value;
		return [
			GameEventProvider.Create(
				tagChange.TimeStamp,
				'WHEEL_OF_DEATH_COUNTER_UPDATED',
				GameEventHelper.CreateProvider(
					'WHEEL_OF_DEATH_COUNTER_UPDATED',
					entity.CardId,
					controllerId,
					entity.Id,
					this.StateFacade,
					{
						TurnsBeforeControllerDies: turnsBeforeControllerDies,
					},
				),
				true,
				node,
			),
		];
	}

	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null {
		const showEntity = node.Object as ShowEntity;
		const controllerId = showEntity.GetEffectiveController();
		const turnsBeforeControllerDies = showEntity.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_1);
		return [
			GameEventProvider.Create(
				showEntity.TimeStamp,
				'WHEEL_OF_DEATH_COUNTER_UPDATED',
				GameEventHelper.CreateProvider(
					'WHEEL_OF_DEATH_COUNTER_UPDATED',
					showEntity.CardId,
					controllerId,
					showEntity.Entity,
					this.StateFacade,
					{
						TurnsBeforeControllerDies: turnsBeforeControllerDies,
					},
				),
				true,
				node,
			),
		];
	}
}
