import { BgsFaceOff } from '@firestone-hs/hs-replay-xml-parser/dist/lib/model/bgs-face-off';
import { BattleResultHistory } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { Race } from '@firestone-hs/reference-data';
import { BgsBattleInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-battle-info';
import { SimulationResult } from '@firestone-hs/simulate-bgs-battle/dist/simulation-result';
import { normalizeHeroCardId } from '../../services/battlegrounds/bgs-utils';
import { RealTimeStatsState } from '../../services/battlegrounds/store/real-time-stats/real-time-stats';
import { BattleInfoMessage } from './battle-info-message.type';
import { BgsPlayer } from './bgs-player';

export class BgsGame {
	readonly reviewId: string;
	readonly players: readonly BgsPlayer[] = [];
	readonly currentTurn: number = 1;
	readonly phase: 'recruit' | 'combat';
	readonly faceOffs: readonly BgsFaceOff[] = [];
	readonly battleInfo: BgsBattleInfo;
	readonly battleInfoStatus: 'empty' | 'waiting-for-result' | 'done';
	readonly battleInfoMesage: BattleInfoMessage;
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
		const newPlayers: readonly BgsPlayer[] = this.players.map((player) =>
			normalizeHeroCardId(player.cardId) === normalizeHeroCardId(newPlayer.cardId) ? newPlayer : player,
		);
		return this.update({ players: newPlayers } as BgsGame);
	}

	public getMainPlayer(): BgsPlayer {
		const mainPlayer = this.players.find((player) => player.isMainPlayer);
		if (!mainPlayer) {
			// console.warn(
			// 	'could not find main player',
			// 	this.players.map((player) => ({
			// 		cardId: player.cardId,
			// 		isMainPlayer: player.isMainPlayer,
			// 		name: player.name,
			// 	})),
			// );
			if (this.players.length === 8) {
				console.error(
					'Could not find main player',
					this.players.map((player) => ({
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

	// Not all players finish their battles at the same time. So you might still be in battle, but
	// another player might have already gone back to the tavern and levelled up for instance
	public getCurrentTurnAdjustedForAsyncPlay(): number {
		// console.debug('getting current turn adjusted', this.currentTurn, this.phase, this);
		if (this.phase === 'combat') {
			return this.currentTurn + 1;
		}
		return this.currentTurn;
	}
}
