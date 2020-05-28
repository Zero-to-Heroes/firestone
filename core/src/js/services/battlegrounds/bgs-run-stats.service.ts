import { EventEmitter, Injectable } from '@angular/core';
import { parseHsReplayString, Replay } from '@firestone-hs/hs-replay-xml-parser';
import { BattleResultHistory, BgsGame } from '../../models/battlegrounds/bgs-game';
import { BgsPlayer } from '../../models/battlegrounds/bgs-player';
import { BgsPostMatchStats } from '../../models/battlegrounds/post-match/bgs-post-match-stats';
import { Events } from '../events.service';
import { OverwolfService } from '../overwolf.service';
import { reparseReplay } from './store/event-parsers/stats/replay-parser';
import { BgsGameEndEvent } from './store/events/bgs-game-end-event';
import { BattlegroundsStoreEvent } from './store/events/_battlegrounds-store-event';

@Injectable()
export class BgsRunStatsService {
	private stateUpdater: EventEmitter<BattlegroundsStoreEvent>;

	constructor(private readonly events: Events, private readonly ow: OverwolfService) {
		this.events.on(Events.START_BGS_RUN_STATS).subscribe(async event => {
			this.computeRunStats(event.data[0], event.data[1]);
		});
		setTimeout(() => {
			this.stateUpdater = this.ow.getMainWindow().battlegroundsUpdater;
		});
	}

	private computeRunStats(reviewId: string, currentGame: BgsGame) {
		const replay: Replay = parseHsReplayString(currentGame.replayXml);
		const player: BgsPlayer = currentGame.getMainPlayer();
		const structure = reparseReplay(replay);
		const winLuckFactor = buildWinLuckFactor(currentGame.battleResultHistory);
		const tieLuckFactor = buildTieLuckFactor(currentGame.battleResultHistory);
		console.warn('luckFactor', winLuckFactor, tieLuckFactor, currentGame.battleResultHistory);
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
		this.stateUpdater.next(new BgsGameEndEvent(postMatchStats));
	}
}

// Returns -1 if had the worst possible luck, and 1 if had the best possible luck
const buildWinLuckFactor = (battleResultHistory: readonly BattleResultHistory[]): number => {
	return spreadAroundZero(
		battleResultHistory
			.filter(history => history.simulationResult) // Mostly for dev, shouldn't happen in real life
			.map(history => {
				const victory = history.actualResult === 'won' ? 1 : 0;
				const chance = history.simulationResult.wonPercent / 100;
				return victory - chance;
			})
			.reduce((a, b) => a + b, 0) / battleResultHistory.length,
	);
};
const buildTieLuckFactor = (battleResultHistory: readonly BattleResultHistory[]): number => {
	return spreadAroundZero(
		battleResultHistory
			.filter(history => history.simulationResult)
			.map(history => {
				const victory = history.actualResult === 'won' || history.actualResult === 'tied' ? 1 : 0;
				const chance = (history.simulationResult.wonPercent + history.simulationResult.tiedPercent) / 100;
				return victory - chance;
			})
			.reduce((a, b) => a + b, 0) / battleResultHistory.length,
	);
};
// Keep the value between -1 and 1 but make it spread more around 0, since the limit cases
// are really rare
const spreadAroundZero = (value: number): number => {
	return Math.sign(value) * Math.pow(Math.abs(value), 0.3);
};
