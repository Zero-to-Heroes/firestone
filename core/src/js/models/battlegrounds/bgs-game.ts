import { BgsFaceOff } from '@firestone-hs/hs-replay-xml-parser/dist/lib/model/bgs-face-off';
import { BattleResultHistory } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { Race } from '@firestone-hs/reference-data';
import { BgsBattleInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-battle-info';
import { SimulationResult } from '@firestone-hs/simulate-bgs-battle/dist/simulation-result';
import { normalizeHeroCardId } from '../../services/battlegrounds/bgs-utils';
import { RealTimeStatsState } from '../../services/battlegrounds/store/real-time-stats/real-time-stats';
import { BgsPlayer } from './bgs-player';

export class BgsGame {
	readonly reviewId: string;
	readonly players: readonly BgsPlayer[] = [];
	readonly currentTurn: number = 1;
	readonly phase: 'recruit' | 'combat';
	readonly faceOffs: readonly BgsFaceOff[] = [];
	readonly battleInfo: BgsBattleInfo;
	readonly battleInfoStatus: 'empty' | 'waiting-for-result' | 'done';
	readonly battleInfoMesage: 'not-supported' | undefined;
	readonly battleResult: SimulationResult;
	readonly battleResultHistory: readonly BattleResultHistory[] = [];
	readonly replayXml: string;
	readonly mmrAtStart: number;
	readonly pogoHoppersCount: number;
	readonly availableRaces: readonly Race[];
	readonly bannedRaces: readonly Race[];
	readonly lastOpponentCardId: string;
	readonly liveStats: RealTimeStatsState;
	readonly gameEnded: boolean;

	public static create(base: BgsGame): BgsGame {
		return Object.assign(new BgsGame(), base);
	}

	public update(base: BgsGame) {
		return Object.assign(new BgsGame(), this, base);
	}

	public updatePlayer(newPlayer: BgsPlayer): BgsGame {
		const newPlayers: readonly BgsPlayer[] = this.players.map(player =>
			normalizeHeroCardId(player.cardId) === normalizeHeroCardId(newPlayer.cardId) ? newPlayer : player,
		);
		return this.update({ players: newPlayers } as BgsGame);
	}

	public getMainPlayer(): BgsPlayer {
		const mainPlayer = this.players.find(player => player.isMainPlayer);
		if (!mainPlayer) {
			console.warn(
				'could not find main player',
				this.players.map(player => ({
					cardId: player.cardId,
					isMainPlayer: player.isMainPlayer,
					name: player.name,
				})),
			);
			if (this.players.length === 8) {
				console.error(
					'Could not find main player',
					this.players.map(player => ({
						cardId: player.cardId,
						isMainPlayer: player.isMainPlayer,
						name: player.name,
					})),
				);
			}
		}
		return mainPlayer;
	}

	public updateActualBattleResult(result: string): BgsGame {
		const newBattleResultHistory: readonly BattleResultHistory[] = [
			...(this.battleResultHistory || []),
			{
				turn: this.currentTurn,
				simulationResult: this.battleResult,
				actualResult: result,
			},
		] as readonly BattleResultHistory[];
		// console.warn('updatedBattleHistory', result, this.battleResult, this.battleResultHistory);
		return Object.assign(new BgsGame(), this, {
			battleResultHistory: newBattleResultHistory,
		} as BgsGame);
	}

	// Not all players finish their turns at the same time.
	public getCurrentTurnAdjustedForAsyncPlay(): number {
		if (this.battleInfo) {
			return this.currentTurn + 1;
		}
		return this.currentTurn;
	}

	// public addBattleBoardInfo(bgsInfo: BgsBoardInfo): BgsGame {
	// 	const battleInfo: any = this.battleInfo || {};
	// 	//console.log('will set battle info', bgsInfo, battleInfo);
	// 	if (!battleInfo.playerBoard) {
	// 		battleInfo.playerBoard = bgsInfo;
	// 		// this.battleInfoStatus = 'waiting-for-result';
	// 	} else if (!battleInfo.opponentBoard) {
	// 		battleInfo.opponentBoard = bgsInfo;
	// 	} else {
	// 		console.warn('trying to set bgsinfo in full data', bgsInfo);
	// 		return this;
	// 	}
	// 	console.log('[bgs-game] setting battle info', battleInfo.opponentBoard?.player?.cardId);
	// 	return Object.assign(new BgsGame(), this, {
	// 		battleInfo: battleInfo,
	// 		battleInfoStatus: !battleInfo.opponentBoard ? 'empty' : 'waiting-for-result',
	// 	} as BgsGame);
	// }
}
