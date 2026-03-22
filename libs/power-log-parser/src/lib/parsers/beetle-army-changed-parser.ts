import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventHelper, GameEventProvider } from '../game-event';
import { Node, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class BeetleArmyChangedParser implements ActionParser {
	readonly ParserName = 'BeetleArmyChangedParser';

	private GameState: GameState;
	private ParserState: ParserState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, facade: StateFacade) {
		this.ParserState = parserState;
		this.GameState = parserState.GameState;
		this.StateFacade = facade;
	}

	AppliesOnNewNode(node: Node, stateType: StateType): boolean {
		const tagChange = node.Object as TagChange;
		return (
			stateType === StateType.PowerTaskList &&
			node.Type === TagChange &&
			this.GameState.CurrentEntities.get(tagChange.Entity)?.CardId ===
				CardIds.BeetleArmyPlayerEnchantDntEnchantment_BG31_808pe &&
			(tagChange.Name === (GameTag.TAG_SCRIPT_DATA_NUM_1 as number) ||
				tagChange.Name === (GameTag.TAG_SCRIPT_DATA_NUM_2 as number))
		);
	}

	AppliesOnCloseNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const tagChange = node.Object as TagChange;
		const entity = this.GameState.CurrentEntities.get(tagChange.Entity);
		if (entity == null) {
			return null;
		}

		const controller = entity.GetController();
		if (controller !== this.StateFacade.LocalPlayer!.PlayerId) {
			return null;
		}

		const atk =
			tagChange.Name === (GameTag.TAG_SCRIPT_DATA_NUM_1 as number)
				? tagChange.Value
				: entity.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_1, 0);
		const health =
			tagChange.Name === (GameTag.TAG_SCRIPT_DATA_NUM_2 as number)
				? tagChange.Value
				: entity.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_2, 0);
		return [
			GameEventProvider.Create(
				tagChange.TimeStamp,
				'BEETLE_ARMY_CHANGED',
				GameEventHelper.CreateProvider(
					'BEETLE_ARMY_CHANGED',
					null as any,
					entity.GetEffectiveController(),
					entity.Id,
					this.StateFacade,
					{
						Attack: atk,
						Health: health,
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
