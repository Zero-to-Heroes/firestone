import { innkeeperNames, bobTavernNames } from '../helper';
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
				if (state.LocalPlayer?.PlayerId === playerId) {
					state.LocalPlayer.Name = playerName;
				}
				if (state.OpponentPlayer?.PlayerId === playerId) {
					state.OpponentPlayer.Name = playerName;
				}
				state.TryAssignLocalPlayer(timestamp, data);
				console.debug('Tried to assign player name', data);
			} catch (e: any) {
				console.debug('Exception while assigning player name', data);
				return false;
			}
			return true;
		}
		return false;
	}
}
