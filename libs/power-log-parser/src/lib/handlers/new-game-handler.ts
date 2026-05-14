import { CardType, GameTag, Zone } from '@firestone-hs/reference-data';
import type { Helper } from '../helper';
import { GameEventProvider } from '../game-event';
import { Game, Node, NodeType } from '../models';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';
import type { GameMetaData } from '../state/game-meta-data';

export class NewGameHandler {
	static Handle(
		timestamp: string,
		data: string,
		state: ParserState,
		previousTimestamp: string,
		stateType: StateType,
		gameInfoHelper: StateFacade,
		currentGameSeed: number,
		resettingGame: boolean,
		metadata: GameMetaData,
		helper: Helper,
	): boolean {
		if (data === 'CREATE_GAME') {
			(state.NodeParser as any).ClearQueue?.();

			console.debug('Handling create game', '');
			const isReconnecting = !resettingGame
				&& (stateType === StateType.GameState
					? state.IsReconnecting(currentGameSeed)
					: gameInfoHelper.GsState!.ReconnectionOngoing);
			if (isReconnecting) {
				for (const entity of state.GameState.CurrentEntities.values()) {
					entity.SetTag(GameTag.ZONE, Zone.REMOVEDFROMGAME as number);
				}
				if (stateType === StateType.GameState) {
					console.debug(
						`Probable reconnect detected ${stateType} ${timestamp} // ${previousTimestamp} // ${state.Ended} // ${state.NumberOfCreates} // ${state.Spectating} // ${stateType} // ${data}`,
						'',
					);
					state.NodeParser.EnqueueGameEvent([
						GameEventProvider.Create(
							timestamp,
							'RECONNECT_START',
							() => ({
								Type: 'RECONNECT_START',
							}),
							false,
							new Node(NodeType.Placeholder, null, 0, null, data),
						),
					]);
				}
				state.ReconnectionOngoing = true;
				state.Spectating = false;
				if (state.IsBattlegrounds()) {
					const minionIds: number[] = [];
					for (const e of state.GameState.CurrentEntities.values()) {
						if (e.GetCardType() === (CardType.MINION as number)) {
							minionIds.push(e.Id);
						}
					}
					for (const minionId of minionIds) {
						state.GameState.CurrentEntities.delete(minionId);
					}
				}
				state.UpdateCurrentNode(NodeType.Game);
				return true;
			}

			helper.NewGame();
			if (stateType === StateType.GameState) {
				metadata.BuildNumber = -1;
				metadata.FormatType = -1;
				metadata.GameType = -1;
				metadata.ScenarioID = -1;
			} else {
				const existingMetaData = gameInfoHelper.GetMetaData();
				metadata.BuildNumber = existingMetaData.BuildNumber;
				metadata.FormatType = existingMetaData.FormatType;
				metadata.GameType = existingMetaData.GameType;
				metadata.ScenarioID = existingMetaData.ScenarioID;
			}

			state.Reset(gameInfoHelper);
			state.NumberOfCreates++;
			state.CurrentGame = new Game();
			state.CurrentGame.TimeStamp = timestamp;
			state.CurrentGame.BuildNumber = metadata.BuildNumber;
			state.CurrentGame.ScenarioID = metadata.ScenarioID;
			state.CurrentGame.FormatType = metadata.FormatType;
			state.CurrentGame.GameType = metadata.GameType;

			state.Replay.Games.push(state.CurrentGame);
			const newNode = new Node(NodeType.Game, state.CurrentGame, 0, null, data);
			state.CreateNewNode(newNode);
			state.Node = newNode;
			console.debug('Created a new game', stateType + ' ' + timestamp + ',' + previousTimestamp);
			return true;
		}
		return false;
	}
}
