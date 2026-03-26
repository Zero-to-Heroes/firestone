import { GameTag } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEvent, GameEventProvider } from '../game-event';
import { Node, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class FatigueParser implements ActionParser {
	readonly ParserName = 'FatigueParser';

	private GameState: GameState;
	private Helper: StateFacade;

	constructor(parserState: ParserState, helper: StateFacade) {
		this.GameState = parserState.GameState;
		this.Helper = helper;
	}

	AppliesOnNewNode(node: Node, stateType: StateType): boolean {
		return (
			stateType === StateType.PowerTaskList &&
			node.Type === TagChange &&
			(node.Object as TagChange).Name === (GameTag.FATIGUE as number)
		);
	}

	AppliesOnCloseNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const tagChange = node.Object as TagChange;
		const entity = this.GameState.CurrentEntities.get(tagChange.Entity)!;
		const fatigueDamage = tagChange.Value;
		return [
			GameEventProvider.Create(
				tagChange.TimeStamp,
				'FATIGUE_DAMAGE',
				() =>
					({
						Type: 'FATIGUE_DAMAGE',
						Value: {
							EntityId: entity.Id,
							LocalPlayer: this.Helper.LocalPlayer,
							OpponentPlayer: this.Helper.OpponentPlayer,
							FatigueDamage: fatigueDamage,
						},
					}) as GameEvent,
				true,
				node,
			),
		];
	}

	CreateGameEventProviderFromClose(_node: Node): GameEventProvider[] | null {
		return null;
	}
}
