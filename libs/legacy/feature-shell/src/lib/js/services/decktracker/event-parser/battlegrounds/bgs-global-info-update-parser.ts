import { ALL_BG_RACES, isBattlegrounds, Race } from '@firestone-hs/reference-data';
import {
	BattlegroundsState,
	BgsBattleHistory,
	BgsComposition,
	BgsPanel,
	BgsPlayer,
	BgsPostMatchStatsPanel,
	GameState,
} from '@firestone/game-state';
import { BattlegroundsInfo, MemoryBgGame, MemoryBgPlayer } from '@firestone/memory';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '@legacy-import/src/lib/js/models/game-event';
import { EventParser } from '../event-parser';

export class BgsGlobalInfoUpdateParser implements EventParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state && isBattlegrounds(state.metadata?.gameType);
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const bgsMemoryInfo: BattlegroundsInfo = gameEvent.additionalData.info;
		if (!bgsMemoryInfo) {
			console.warn('[bgs-info-updater] no memory info found in event', gameEvent);
			return currentState;
		}

		const game: MemoryBgGame = bgsMemoryInfo?.Game;
		const turn = currentState.getCurrentTurnAdjustedForAsyncPlay();
		const playersFromMemory = game?.Players;
		if (!playersFromMemory || playersFromMemory.length === 0) {
			console.warn('[bgs-info-updater] no players found in memory');
			return currentState;
		}

		if (!currentState.bgState?.currentGame) {
			console.warn('[bgs-info-updater] no current game found in state');
			return currentState;
		}

		const newPlayers: readonly BgsPlayer[] = currentState.bgState.currentGame.players
			.filter((player) => player.cardId !== 'TB_BaconShop_HERO_PH')
			.map((player) => {
				const playerFromMemory = playersFromMemory.find((mem) => mem.Id === player.playerId);
				// console.debug('found player from memory', playerFromMemory, playersFromMemory, player);
				if (!playerFromMemory) {
					return player;
				}

				// Damage is not always present, since we don't want to spoil the battle result too early
				const newDamage = Math.max(0, playerFromMemory.Damage ?? 0) || player.damageTaken;
				const newWinStreak = Math.max(0, playerFromMemory.WinStreak ?? 0);
				const newHighestWinStreak = Math.max(player.highestWinStreak || 0, playerFromMemory.WinStreak ?? 0);
				const newCompositionHistory: readonly BgsComposition[] = [
					...player.compositionHistory.filter((h) => h && h.turn !== turn),
					this.buildNewBgsComposition(currentState, playerFromMemory),
				];
				const newBattleHistory: readonly BgsBattleHistory[] = [
					...player.battleHistory.filter((h) => h && h.turn !== turn),
					this.buildNewBgsBattleHistory(currentState, playerFromMemory),
				];
				return player.update({
					name: playerFromMemory.Name?.length ? playerFromMemory.Name : player.name,
					displayedCardId: playerFromMemory.CardId,
					damageTaken: newDamage,
					initialHealth: playerFromMemory.MaxHealth ?? player.initialHealth,
					currentArmor: playerFromMemory.Armor ?? 0,
					currentWinStreak: newWinStreak,
					highestWinStreak: newHighestWinStreak,
					compositionHistory: newCompositionHistory,
					battleHistory: newBattleHistory,
					totalTriples: Math.max(0, playerFromMemory.TriplesCount ?? 0),
					mmr: playerFromMemory.Mmr,
				} as BgsPlayer);
			});
		const [availableRaces, bannedRaces] = BgsGlobalInfoUpdateParser.buildRaces(game.AvailableRaces);
		if (!availableRaces?.length) {
			console.warn('[bgs-info-updater] no available races found in memory', game.AvailableRaces);
		}

		const newGame = currentState.bgState.currentGame.update({
			players: newPlayers,
			bannedRaces:
				bannedRaces && bannedRaces.length > 0 ? bannedRaces : currentState.bgState.currentGame.bannedRaces,
			availableRaces:
				availableRaces && availableRaces.length > 0
					? availableRaces
					: currentState.bgState?.currentGame?.availableRaces ?? [],
		});
		const newPostMatchPanel: BgsPostMatchStatsPanel = this.addTribeInfoToPostMatchPanel(
			currentState.bgState,
			newGame.availableRaces,
		);
		const panels: readonly BgsPanel[] = currentState.bgState.panels.map((panel) =>
			panel.id === newPostMatchPanel.id ? newPostMatchPanel : panel,
		);

		return currentState.update({
			bgState: currentState.bgState.update({
				currentGame: newGame,
				panels: panels,
			}),
		});
	}

	event(): string {
		return GameEvent.BATTLEGROUNDS_GLOBAL_INFO_UPDATE;
	}

	private buildNewBgsComposition(currentState: GameState, playerFromMemory: MemoryBgPlayer): BgsComposition {
		return {
			turn: currentState.getCurrentTurnAdjustedForAsyncPlay(),
			tribe: playerFromMemory.BoardCompositionRace === 0 ? 'mixed' : Race[playerFromMemory.BoardCompositionRace],
			count: playerFromMemory.BoardCompositionCount,
		};
	}

	private buildNewBgsBattleHistory(currentState: GameState, playerFromMemory: MemoryBgPlayer): BgsBattleHistory {
		if (!playerFromMemory?.Battles?.length) {
			return null;
		}
		const latestBattle = playerFromMemory.Battles[playerFromMemory.Battles.length - 1];
		return {
			turn: currentState.getCurrentTurnAdjustedForAsyncPlay(),
			opponentCardId: latestBattle.OpponentCardId,
			damage: latestBattle.Damage,
			isDefeated: latestBattle.IsDefeated,
		};
	}

	private addTribeInfoToPostMatchPanel(
		currentState: BattlegroundsState,
		availableTribes: readonly Race[],
	): BgsPostMatchStatsPanel {
		const panelToRebuild: BgsPostMatchStatsPanel = (
			currentState.panels.find((panel) => panel.id === 'bgs-post-match-stats') as BgsPostMatchStatsPanel
		).update({
			availableTribes: availableTribes,
		} as BgsPostMatchStatsPanel);
		return panelToRebuild;
	}

	public static buildRaces(availableRaces: readonly number[]): [readonly Race[], readonly Race[]] {
		if (!availableRaces || availableRaces.length === 0) {
			console.warn('[bgs-info-updater] no tribe info read from memory');
			return [null, null];
		}
		return [
			ALL_BG_RACES.filter((race) => availableRaces.includes(race)),
			ALL_BG_RACES.filter((race) => !availableRaces.includes(race)),
		];
	}
}
