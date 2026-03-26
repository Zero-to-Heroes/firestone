import { innkeeperNames, bobTavernNames } from '../helper';
import { Logger } from '../logger';
import { Regexes } from '../regexes';
import type { ParserState, StateType } from '../state/parser-state';

export class PlayerNameHandler {
	static Handle(timestamp: string, data: string, state: ParserState, stateType: StateType): boolean {
		const match = Regexes.PlayerNameAssignment.exec(data);
		if (match) {
			const playerId = parseInt(match[1], 10);
			const playerName = match[2];
			try {
				const matchingPlayer = state.getPlayers().find((player) => player.PlayerId === playerId);
				if (!matchingPlayer) {
					return false;
				}
				matchingPlayer.Name = playerName;
				matchingPlayer.InitialName = innkeeperNames.includes(playerName)
					? innkeeperNames[0]
					: bobTavernNames.includes(playerName)
						? bobTavernNames[0]
						: playerName;
				state.TryAssignLocalPlayer(timestamp, data);
				Logger.Log('Tried to assign player name', data);
			} catch (e: any) {
				Logger.Log('Exception while assigning player name', data);
				return false;
			}
			return true;
		}
		return false;
	}
}
