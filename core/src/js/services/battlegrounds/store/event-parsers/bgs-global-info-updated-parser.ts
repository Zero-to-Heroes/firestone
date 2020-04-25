import { Race } from '@firestone-hs/reference-data';
import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsGame } from '../../../../models/battlegrounds/bgs-game';
import { BgsPlayer } from '../../../../models/battlegrounds/bgs-player';
import { BgsComposition } from '../../../../models/battlegrounds/in-game/bgs-composition';
import { BgsGlobalInfoUpdatedEvent } from '../events/bgs-global-info-updated-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsGlobalInfoUpdatedParser implements EventParser {
	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsGlobalInfoUpdatedEvent';
	}

	public async parse(
		currentState: BattlegroundsState,
		event: BgsGlobalInfoUpdatedEvent,
	): Promise<BattlegroundsState> {
		console.log('in BgsGlobalInfoUpdatedParser', event.info);
		const players = event.info?.game?.Players;
		if (!players || players.length === 0) {
			console.log('no players, returning&');
			return currentState;
		}
		const newPlayers: readonly BgsPlayer[] = currentState.currentGame.players.map(player => {
			const playerFromMemory = players.find(mem => mem.CardId === player.cardId);
			if (!playerFromMemory) {
				return player;
			}
			return player.update({
				damageTaken: playerFromMemory.Damage as number,
				currentWinStreak: playerFromMemory.WinStreak as number,
				highestWinStreak: Math.max(player.highestWinStreak, playerFromMemory.WinStreak as number),
				compositionHistory: [
					...player.compositionHistory,
					{
						turn: currentState.currentGame.currentTurn,
						tribe:
							playerFromMemory.BoardCompositionRace === 0
								? 'mixed'
								: Race[playerFromMemory.BoardCompositionRace],
						count: playerFromMemory.BoardCompositionCount,
					} as BgsComposition,
				] as readonly BgsComposition[],
			} as BgsPlayer);
		});
		const newGame = currentState.currentGame.update({
			players: newPlayers,
		} as BgsGame);
		return currentState.update({
			currentGame: newGame,
		} as BattlegroundsState);
	}
}
