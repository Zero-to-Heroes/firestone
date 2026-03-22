import { ActionParser } from '../action-parser';
import { GameEventProvider } from '../game-event';
import { Node, ShuffleDeck } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class ShuffleDeckParser implements ActionParser {
	readonly ParserName = 'ShuffleDeckParser';

	private GameState: GameState;
	private ParserState: ParserState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, stateFacade: StateFacade) {
		this.ParserState = parserState;
		this.GameState = parserState.GameState;
		this.StateFacade = stateFacade;
	}

	AppliesOnNewNode(node: Node, stateType: StateType): boolean {
		return stateType === StateType.PowerTaskList && node.Type === ShuffleDeck;
	}

	AppliesOnCloseNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const shuffleDeck = node.Object as ShuffleDeck;
		return [
			GameEventProvider.Create(
				shuffleDeck.TimeStamp,
				'SHUFFLE_DECK',
				() => ({
					Type: 'SHUFFLE_DECK',
					Value: {
						PlayerId: shuffleDeck.PlayerId,
						LocalPlayer: this.StateFacade.LocalPlayer,
						OpponentPlayer: this.StateFacade.OpponentPlayer,
					},
				}),
				false,
				node,
			),
		];
	}

	CreateGameEventProviderFromClose(_node: Node): GameEventProvider[] | null {
		return null;
	}
}
