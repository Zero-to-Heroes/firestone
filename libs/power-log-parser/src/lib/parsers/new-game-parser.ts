import { ActionParser } from '../action-parser';
import { GameEventProvider } from '../game-event';
import { Game, Node } from '../models';
import { Logger } from '../logger';
import { Utility } from '../utility';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class NewGameParser implements ActionParser {
	readonly ParserName = 'NewGameParser';

	private ParserState: ParserState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, stateFacade: StateFacade) {
		this.ParserState = parserState;
		this.StateFacade = stateFacade;
	}

	AppliesOnNewNode(node: Node, stateType: StateType): boolean {
		return stateType === StateType.GameState && node.Type === Game && !this.ParserState.ReconnectionOngoing;
	}

	AppliesOnCloseNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		Logger.Log('will emit NEW_GAME event', node.CreationLogLine);
		return [
			GameEventProvider.Create(
				(node.Object as Game).TimeStamp,
				'NEW_GAME',
				() => ({
					Type: 'NEW_GAME',
					Value: {
						Spectating: this.StateFacade.Spectating,
						Timestamp: Utility.GetUtcTimestamp((node.Object as Game).TimeStamp),
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
