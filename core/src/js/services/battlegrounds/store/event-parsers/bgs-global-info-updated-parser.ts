import { Race } from '@firestone-hs/reference-data';
import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsGame } from '../../../../models/battlegrounds/bgs-game';
import { BgsPlayer } from '../../../../models/battlegrounds/bgs-player';
import { BgsComposition } from '../../../../models/battlegrounds/in-game/bgs-composition';
import { normalizeHeroCardId } from '../../bgs-utils';
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
		// console.log('in BgsGlobalInfoUpdatedParser', event.info);
		const players = event.info?.game?.Players;
		if (!players || players.length === 0) {
			console.log('no players, returning&');
			return currentState;
		}
		const newPlayers: readonly BgsPlayer[] = currentState.currentGame.players
			.filter(player => player.cardId !== 'TB_BaconShop_HERO_PH')
			.map(player => {
				const playerFromMemory = players.find(
					mem => normalizeHeroCardId(mem.CardId) === normalizeHeroCardId(player.cardId),
				);
				if (!playerFromMemory) {
					return player;
				}
				const newDamage = playerFromMemory.Damage as number;
				const newWinStreak = (playerFromMemory.WinStreak as number) || 0;
				const newHighestWinStreak = Math.max(
					player.highestWinStreak || 0,
					(playerFromMemory.WinStreak as number) || 0,
				);
				return player.update({
					displayedCardId: playerFromMemory.CardId,
					damageTaken: newDamage,
					currentWinStreak: newWinStreak,
					highestWinStreak: newHighestWinStreak,
					compositionHistory: [
						...player.compositionHistory,
						{
							turn: currentState.currentGame.getCurrentTurnAdjustedForAsyncPlay(),
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
