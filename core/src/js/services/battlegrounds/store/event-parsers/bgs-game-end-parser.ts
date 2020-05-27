import { parseHsReplayString, Replay } from '@firestone-hs/hs-replay-xml-parser';
import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BattleResultHistory } from '../../../../models/battlegrounds/bgs-game';
import { BgsPanel } from '../../../../models/battlegrounds/bgs-panel';
import { BgsPlayer } from '../../../../models/battlegrounds/bgs-player';
import { BgsStage } from '../../../../models/battlegrounds/bgs-stage';
import { BgsInGameStage } from '../../../../models/battlegrounds/in-game/bgs-in-game-stage';
import { BgsPostMatchStage } from '../../../../models/battlegrounds/post-match/bgs-post-match-stage';
import { BgsPostMatchStats } from '../../../../models/battlegrounds/post-match/bgs-post-match-stats';
import { BgsPostMatchStatsPanel } from '../../../../models/battlegrounds/post-match/bgs-post-match-stats-panel';
import { BgsGameEndEvent } from '../events/bgs-game-end-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { reparseReplay } from './stats/replay-parser';
import { EventParser } from './_event-parser';

// TODO: coins wasted doesn't take into account hero powers that let you have more coins (Bel'ial)
export class BgsGameEndParser implements EventParser {
	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsGameEndEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsGameEndEvent): Promise<BattlegroundsState> {
		const newPostMatchStatsStage: BgsPostMatchStage = this.buildPostMatchStage(event.replayXml, currentState);
		const stages: readonly BgsStage[] = currentState.stages.map(stage =>
			stage.id === newPostMatchStatsStage.id ? newPostMatchStatsStage : stage,
		);
		return currentState.update({
			stages: stages,
			currentStageId: 'post-match',
			currentPanelId: 'bgs-post-match-stats',
			forceOpen: true,
		} as BattlegroundsState);
	}

	private buildPostMatchStage(replayXml: string, currentState: BattlegroundsState): BgsPostMatchStage {
		const stageToRebuild =
			currentState.stages.find(stage => stage.id === 'post-match') || this.createNewStage(currentState);
		const panelToRebuild = this.createNewPanel(currentState, replayXml);

		const panels: readonly BgsPanel[] = stageToRebuild.panels.map(panel =>
			panel.id === 'bgs-post-match-stats' ? panelToRebuild : panel,
		);
		return BgsPostMatchStage.create({
			panels: panels,
		} as BgsPostMatchStage);
	}

	private createNewStage(currentState: BattlegroundsState): BgsInGameStage {
		return BgsPostMatchStage.create({
			panels: [BgsPostMatchStatsPanel.create({} as BgsPostMatchStatsPanel)] as readonly BgsPanel[],
		} as BgsPostMatchStage);
	}

	private createNewPanel(currentState: BattlegroundsState, replayXml: string): BgsPostMatchStatsPanel {
		console.warn('battleResultHistory', currentState.currentGame.battleResultHistory);
		const replay: Replay = parseHsReplayString(replayXml);
		const player: BgsPlayer = currentState.currentGame.getMainPlayer();
		const structure = reparseReplay(replay);
		const winLuckFactor = buildWinLuckFactor(currentState.currentGame.battleResultHistory);
		const tieLuckFactor = buildTieLuckFactor(currentState.currentGame.battleResultHistory);
		console.warn('luckFactor', winLuckFactor, tieLuckFactor, currentState.currentGame.battleResultHistory);
		const postMatchStats: BgsPostMatchStats = BgsPostMatchStats.create({
			tavernTimings: player.tavernUpgradeHistory,
			tripleTimings: player.tripleHistory, // TODO: add the cards when relevant
			coinsWastedOverTurn: structure.coinsWastedOverTurn,
			rerolls: structure.rerollsOverTurn.map(turnInfo => turnInfo.value).reduce((a, b) => a + b, 0),
			boardHistory: player.boardHistory,
			// compositionsOverTurn: structure.compositionsOverTurn,
			rerollsOverTurn: structure.rerollsOverTurn,
			freezesOverTurn: structure.freezesOverTurn,
			mainPlayerHeroPowersOverTurn: structure.mainPlayerHeroPowersOverTurn,
			hpOverTurn: structure.hpOverTurn,
			totalStatsOverTurn: structure.totalStatsOverTurn,
			minionsBoughtOverTurn: structure.minionsBoughtOverTurn,
			minionsSoldOverTurn: structure.minionsSoldOverTurn,
			totalMinionsDamageDealt: structure.totalMinionsDamageDealt,
			totalMinionsDamageTaken: structure.totalMinionsDamageTaken,
			totalEnemyMinionsKilled: structure.totalEnemyMinionsKilled,
			totalEnemyHeroesKilled: structure.totalEnemyHeroesKilled,
			wentFirstInBattleOverTurn: structure.wentFirstInBattleOverTurn,
			luckFactor: (2 * winLuckFactor + tieLuckFactor) / 3,
		} as BgsPostMatchStats);
		const finalPosition = player.leaderboardPlace;
		console.log('post match stats', postMatchStats);
		return BgsPostMatchStatsPanel.create({
			stats: postMatchStats,
			globalStats: currentState.globalStats,
			player: currentState.currentGame.getMainPlayer(),
			selectedStat: 'hp-by-turn',
			tabs: ['hp-by-turn', 'warband-total-stats-by-turn', 'warband-composition-by-turn'],
			isComputing: false,
			name: 'You finished #' + finalPosition,
		} as BgsPostMatchStatsPanel);
	}
}

// Returns -1 if had the worst possible luck, and 1 if had the best possible luck
const buildWinLuckFactor = (battleResultHistory: readonly BattleResultHistory[]): number => {
	return (
		battleResultHistory
			.map(history => {
				const victory = history.actualResult === 'won' ? 1 : 0;
				const chance = history.simulationResult.wonPercent / 100;
				return victory - chance;
			})
			.reduce((a, b) => a + b, 0) / battleResultHistory.length
	);
};
const buildTieLuckFactor = (battleResultHistory: readonly BattleResultHistory[]): number => {
	return (
		battleResultHistory
			.map(history => {
				const victory = history.actualResult === 'won' || history.actualResult === 'tied' ? 1 : 0;
				const chance = (history.simulationResult.wonPercent + history.simulationResult.tiedPercent) / 100;
				return victory - chance;
			})
			.reduce((a, b) => a + b, 0) / battleResultHistory.length
	);
};
