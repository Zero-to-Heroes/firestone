import { BattleResultHistory } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { BgsBattleInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-battle-info';
import { BgsBoardInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-board-info';
import { normalizeHeroCardId } from '../../services/battlegrounds/bgs-utils';
import { BgsBattleSimulationResult } from './bgs-battle-simulation-result';
import { BgsFaceOff } from './bgs-face-off';
import { BgsPlayer } from './bgs-player';

export class BgsGame {
	readonly players: readonly BgsPlayer[] = [];
	readonly currentTurn: number = 1;
	readonly faceOffs: readonly BgsFaceOff[] = [];
	readonly battleInfo: BgsBattleInfo;
	readonly battleInfoStatus: 'empty' | 'waiting-for-result' | 'done';
	readonly battleResult: BgsBattleSimulationResult;
	readonly battleResultHistory: readonly BattleResultHistory[] = [];
	readonly replayXml: string;
	readonly mmrAtStart: number;
	readonly pogoHoppersCount: number;

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
			console.error(
				'Could not find main player',
				this.players.map(player => {
					player.cardId, player.isMainPlayer, player.name;
				}),
			);
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

	public addBattleBoardInfo(bgsInfo: BgsBoardInfo): BgsGame {
		const battleInfo: any = this.battleInfo || {};
		if (!battleInfo.playerBoard) {
			battleInfo.playerBoard = bgsInfo;
		} else if (!battleInfo.opponentBoard) {
			battleInfo.opponentBoard = bgsInfo;
			// console.log('Set battle info', JSON.stringify(battleInfo, null, 4));
		} else {
			console.warn('trying to set bgsinfo in full data', this, bgsInfo);
			return this;
		}
		return Object.assign(new BgsGame(), this, {
			battleInfo: battleInfo,
			battleInfoStatus: !battleInfo.opponentBoard ? 'empty' : 'waiting-for-result',
		} as BgsGame);
	}
}
