import { GameEventProvider } from '../game-event';
import { Logger } from '../logger';
import { Node, NodeType } from '../models';
import type { ParserState } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class SpectatorHandler {
	static Handle(
		timestamp: string,
		data: string,
		state: ParserState,
		stateFacade: StateFacade,
	): boolean {
		if (data.includes('Begin Spectating') && !data.includes('2nd')) {
			Logger.Log('Will handle spectate log', data);
			state.Reset(stateFacade);
			state.Spectating = true;
			state.NodeParser.EnqueueGameEvent([
				GameEventProvider.Create(
					timestamp,
					'SPECTATING',
					() => ({
						Type: 'SPECTATING',
						Value: {
							LocalPlayer: stateFacade.LocalPlayer,
							OpponentPlayer: stateFacade.OpponentPlayer,
							Spectating: true,
						},
					}),
					false,
					new Node(NodeType.Placeholder, null, 0, null, data),
					true,
				),
			]);
		}
		if (data.includes('End Spectator Mode')) {
			Logger.Log('Will handle end of spectate', data);
			if (stateFacade?.LocalPlayer == null) {
				return false;
			}

			const gameStateReport = state.GameState.BuildGameStateReport(stateFacade);
			state.Spectating = false;
			state.NodeParser.EnqueueGameEvent([
				GameEventProvider.Create(
					timestamp,
					'SPECTATING',
					() => ({
						Type: 'SPECTATING',
						Value: {
							LocalPlayer: stateFacade.LocalPlayer,
							OpponentPlayer: stateFacade.OpponentPlayer,
							Spectating: false,
						},
					}),
					false,
					new Node(NodeType.Placeholder, null, 0, null, data),
					true,
				),
			]);
			state.EndCurrentGame();
			return true;
		}
		return false;
	}
}
