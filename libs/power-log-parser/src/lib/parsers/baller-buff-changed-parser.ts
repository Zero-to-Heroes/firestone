import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventHelper, GameEventProvider } from '../game-event';
import { Node, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class BallerBuffChangedParser implements ActionParser {
	readonly ParserName = 'BallerBuffChangedParser';

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
			this.GameState.CurrentEntities.get(tagChange?.Entity ?? -1)?.CardId ===
				CardIds.BallerPlayerEnchantDntEnchantment_BG31_816pe &&
			tagChange.Name === (GameTag.TAG_SCRIPT_DATA_NUM_1 as number)
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

		const value = tagChange.Value;
		return [
			GameEventProvider.Create(
				tagChange.TimeStamp,
				'BALLER_BUFF_CHANGED',
				GameEventHelper.CreateProvider(
					'BALLER_BUFF_CHANGED',
					null as any,
					entity.GetEffectiveController(),
					entity.Id,
					this.StateFacade,
					{
						Buff: value,
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
