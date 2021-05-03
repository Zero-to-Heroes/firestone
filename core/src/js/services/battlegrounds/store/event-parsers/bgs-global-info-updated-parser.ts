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
			console.log('no players, returning&', event);
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
				// Damage is not always present, since we don't want to spoil the battle result too early
				const newDamage = (playerFromMemory.Damage as number) || player.damageTaken;
				const newWinStreak = (playerFromMemory.WinStreak as number) || 0;
				const newHighestWinStreak = Math.max(
					player.highestWinStreak || 0,
					(playerFromMemory.WinStreak as number) || 0,
				);
				const turn = currentState.currentGame.getCurrentTurnAdjustedForAsyncPlay();
				const newCompositionHistory = player.compositionHistory.find(history => history.turn === turn)
					? player.compositionHistory
					: ([
							...player.compositionHistory,
							{
								turn: currentState.currentGame.getCurrentTurnAdjustedForAsyncPlay(),
								tribe:
									playerFromMemory.BoardCompositionRace === 0
										? 'mixed'
										: Race[playerFromMemory.BoardCompositionRace],
								count: playerFromMemory.BoardCompositionCount,
							} as BgsComposition,
					  ] as readonly BgsComposition[]);
				return player.update({
					displayedCardId: playerFromMemory.CardId,
					damageTaken: newDamage,
					currentWinStreak: newWinStreak,
					highestWinStreak: newHighestWinStreak,
					compositionHistory: newCompositionHistory,
				} as BgsPlayer);
			});
		const [availableRaces, bannedRaces] = BgsGlobalInfoUpdatedParser.buildRaces(event.info?.game?.AvailableRaces);
		const newGame = currentState.currentGame.update({
			players: newPlayers,
			bannedRaces: bannedRaces && bannedRaces.length > 0 ? bannedRaces : currentState.currentGame.bannedRaces,
			availableRaces:
				availableRaces && availableRaces.length > 0
					? availableRaces
					: currentState?.currentGame?.availableRaces ?? [],
		} as BgsGame);
		// console.log('[bgs-info] updated new game', newGame);
		return currentState.update({
			currentGame: newGame,
		} as BattlegroundsState);
	}

	public static buildRaces(availableRaces: readonly number[]): [readonly Race[], readonly Race[]] {
		if (!availableRaces || availableRaces.length === 0) {
			console.warn('[bgs-info-updater] no tribe info read from memory');
			return [undefined, undefined];
		}
		const allRaces = [Race.BEAST, Race.DEMON, Race.DRAGON, Race.MECH, Race.MURLOC, Race.PIRATE, Race.ELEMENTAL];
		return [
			allRaces.filter(race => availableRaces.includes(race)),
			allRaces.filter(race => !availableRaces.includes(race)),
		];
	}
}
