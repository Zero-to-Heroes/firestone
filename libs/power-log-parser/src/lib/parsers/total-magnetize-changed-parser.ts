import { GameTag } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventHelper, GameEventProvider } from '../game-event';
import { Node, NodeType, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class TotalMagnetizeChangedParser implements ActionParser {
	readonly ParserName = 'TotalMagnetizeChangedParser';

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
			node.Type === NodeType.TagChange &&
			(node.Object as TagChange).Name === (GameTag.BACON_NUM_MAGNETIZE_THIS_GAME as number)
		);
	}

	AppliesOnCloseNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const tagChange = node.Object as TagChange;
		if (tagChange.Entity !== this.StateFacade.LocalPlayer!.Id) {
			return null;
		}

		const newValue = tagChange.Value;
		return [
			GameEventProvider.Create(
				tagChange.TimeStamp,
				'TOTAL_MAGNETIZE_CHANGED',
				GameEventHelper.CreateProvider(
					'TOTAL_MAGNETIZE_CHANGED',
					null as any,
					this.StateFacade.LocalPlayer!.PlayerId,
					this.StateFacade.LocalPlayer!.Id,
					this.StateFacade,
					{
						NewValue: newValue,
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
