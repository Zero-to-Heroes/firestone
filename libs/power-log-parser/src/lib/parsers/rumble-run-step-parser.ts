import { GameTag, ScenarioId } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider } from '../game-event';
import { Action, Node, NodeType, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

const STARTING_HEALTH = 20;

export class RumbleRunStepParser implements ActionParser {
	readonly ParserName = 'RumbleRunStepParser';

	private GameState: GameState;
	private ParserState: ParserState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, stateFacade: StateFacade) {
		this.ParserState = parserState;
		this.GameState = parserState.GameState;
		this.StateFacade = stateFacade;
	}

	AppliesOnNewNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	AppliesOnCloseNode(node: Node, stateType: StateType): boolean {
		return (
			stateType === StateType.PowerTaskList &&
			node.Type === NodeType.Action &&
			(node.Object as Action).Data
				.filter((data) => data.constructor === TagChange)
				.map((data) => data as unknown as TagChange)
				.filter((tag) => tag.Name === (GameTag.HEALTH as number) && !!tag.DefChange?.trim())
				.length > 0
		);
	}

	CreateGameEventProviderFromNew(_node: Node): GameEventProvider[] | null {
		return null;
	}

	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null {
		return [
			GameEventProvider.Create(
				(node.Object as Action).TimeStamp,
				'RUMBLE_RUN_STEP',
				() => {
					if (this.StateFacade.ScenarioID !== (ScenarioId.TRLA_DUNGEON as number)) {
						return null;
					}
					const action = node.Object as Action;
					const heroEntityId = this.ParserState.GetEntity(this.StateFacade.LocalPlayer!.Id)!.GetTag(
						GameTag.HERO_ENTITY,
					);
					const tagChange = action.Data.filter((data) => data.constructor === TagChange)
						.map((data) => data as unknown as TagChange)
						.filter((tag) => tag.Name === (GameTag.HEALTH as number) && !!tag.DefChange?.trim())
						.find((tag) => tag.Entity === heroEntityId);
					const healthChangeDef =
						(tagChange != null
							? tagChange.Value
							: this.ParserState.GetEntity(heroEntityId)!.GetTag(GameTag.HEALTH)) - STARTING_HEALTH;
					const runStep = 1 + Math.floor(healthChangeDef / 5);
					return {
						Type: 'RUMBLE_RUN_STEP',
						Value: runStep,
					};
				},
				true,
				node,
			),
		];
	}
}
