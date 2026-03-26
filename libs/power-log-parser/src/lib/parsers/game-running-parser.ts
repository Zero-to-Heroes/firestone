import { GameTag, Zone } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider } from '../game-event';
import { Node, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class GameRunningParser implements ActionParser {
	readonly ParserName = 'GameRunningParser';

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
			node.Type === TagChange &&
			(node.Object as TagChange).Name === (GameTag.STATE as number) &&
			(node.Object as TagChange).Value === 2 // State.RUNNING
		);
	}

	AppliesOnCloseNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const tagChange = node.Object as TagChange;
		const stateCopy = [...this.ParserState.GameState.CurrentEntities.values()]
			.filter((entity) => entity.GetTag(GameTag.ZONE) === (Zone.DECK as number))
			.map((entity) => entity.GetEffectiveController());
		return [
			GameEventProvider.Create(
				tagChange.TimeStamp,
				'GAME_RUNNING',
				() => {
					const playerDeckCount = stateCopy.filter(
						(controller) => controller === this.StateFacade.LocalPlayer!.PlayerId,
					).length;
					const opponentDeckCount = stateCopy.filter(
						(controller) => controller === this.StateFacade.OpponentPlayer!.PlayerId,
					).length;
					return {
						Type: 'GAME_RUNNING',
						Value: {
							LocalPlayer: this.StateFacade.LocalPlayer,
							OpponentPlayer: this.StateFacade.OpponentPlayer,
							AdditionalProps: {
								PlayerDeckCount: playerDeckCount,
								OpponentDeckCount: opponentDeckCount,
							},
						},
					};
				},
				true,
				node,
			),
		];
	}

	CreateGameEventProviderFromClose(_node: Node): GameEventProvider[] | null {
		return null;
	}
}
