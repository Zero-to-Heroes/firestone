import { ALL_BG_RACES, Race } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@services/cards-facade.service';
import { MemoryBgGame, MemoryBgPlayer } from '../../../../models/battlegrounds-info';
import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsGame } from '../../../../models/battlegrounds/bgs-game';
import { BgsPanel } from '../../../../models/battlegrounds/bgs-panel';
import { BgsPlayer } from '../../../../models/battlegrounds/bgs-player';
import { BgsBattleHistory } from '../../../../models/battlegrounds/in-game/bgs-battle-history';
import { BgsComposition } from '../../../../models/battlegrounds/in-game/bgs-composition';
import { BgsPostMatchStatsPanel } from '../../../../models/battlegrounds/post-match/bgs-post-match-stats-panel';
import { normalizeHeroCardId } from '../../bgs-utils';
import { BgsGlobalInfoUpdatedEvent } from '../events/bgs-global-info-updated-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsGlobalInfoUpdatedParser implements EventParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsGlobalInfoUpdatedEvent';
	}

	public async parse(
		currentState: BattlegroundsState,
		event: BgsGlobalInfoUpdatedEvent,
	): Promise<BattlegroundsState> {
		const game: MemoryBgGame = event.info?.Game;
		const turn = currentState.currentGame.getCurrentTurnAdjustedForAsyncPlay();
		const playersFromMemory = game?.Players;
		if (!playersFromMemory || playersFromMemory.length === 0) {
			console.log('no players, returning');
			return currentState;
		}
		const newPlayers: readonly BgsPlayer[] = currentState.currentGame.players
			.filter((player) => player.cardId !== 'TB_BaconShop_HERO_PH')
			.map((player) => {
				const playerFromMemory = playersFromMemory.find(
					(mem) =>
						normalizeHeroCardId(mem.CardId, this.allCards) ===
						normalizeHeroCardId(player.cardId, this.allCards),
				);
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
					displayedCardId: playerFromMemory.CardId,
					damageTaken: newDamage,
					initialHealth: playerFromMemory.MaxHealth ?? player.initialHealth,
					currentWinStreak: newWinStreak,
					highestWinStreak: newHighestWinStreak,
					compositionHistory: newCompositionHistory,
					battleHistory: newBattleHistory,
					totalTriples: Math.max(0, playerFromMemory.TriplesCount ?? 0),
				} as BgsPlayer);
			});
		const [availableRaces, bannedRaces] = BgsGlobalInfoUpdatedParser.buildRaces(event.info?.Game?.AvailableRaces);
		const newGame = currentState.currentGame.update({
			players: newPlayers,
			bannedRaces: bannedRaces && bannedRaces.length > 0 ? bannedRaces : currentState.currentGame.bannedRaces,
			availableRaces:
				availableRaces && availableRaces.length > 0
					? availableRaces
					: currentState?.currentGame?.availableRaces ?? [],
		} as BgsGame);
		const newPostMatchPanel: BgsPostMatchStatsPanel = this.addTribeInfoToPostMatchPanel(
			currentState,
			newGame.availableRaces,
		);
		const panels: readonly BgsPanel[] = currentState.panels.map((panel) =>
			panel.id === newPostMatchPanel.id ? newPostMatchPanel : panel,
		);

		return currentState.update({
			currentGame: newGame,
			panels: panels,
		} as BattlegroundsState);
	}

	private buildNewBgsComposition(currentState: BattlegroundsState, playerFromMemory: MemoryBgPlayer): BgsComposition {
		return {
			turn: currentState.currentGame.getCurrentTurnAdjustedForAsyncPlay(),
			tribe: playerFromMemory.BoardCompositionRace === 0 ? 'mixed' : Race[playerFromMemory.BoardCompositionRace],
			count: playerFromMemory.BoardCompositionCount,
		};
	}

	private buildNewBgsBattleHistory(
		currentState: BattlegroundsState,
		playerFromMemory: MemoryBgPlayer,
	): BgsBattleHistory {
		if (!playerFromMemory?.Battles?.length) {
			return null;
		}
		const latestBattle = playerFromMemory.Battles[playerFromMemory.Battles.length - 1];
		return {
			turn: currentState.currentGame.getCurrentTurnAdjustedForAsyncPlay(),
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
