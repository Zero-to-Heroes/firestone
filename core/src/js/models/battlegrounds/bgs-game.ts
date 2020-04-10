import { BgsBattleInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-battle-info';
import { BgsBoardInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-board-info';
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

	public static create(base: BgsGame): BgsGame {
		return Object.assign(new BgsGame(), base);
	}

	public update(base: BgsGame) {
		return Object.assign(new BgsGame(), this, base);
	}

	public updatePlayer(newPlayer: BgsPlayer): BgsGame {
		const newPlayers: readonly BgsPlayer[] = this.players.map(player =>
			player.cardId === newPlayer.cardId ? newPlayer : player,
		);
		return this.update({ players: newPlayers } as BgsGame);
	}

	public getMainPlayer(): BgsPlayer {
		return this.players.find(player => player.isMainPlayer);
	}

	public addBattleBoardInfo(bgsInfo: BgsBoardInfo): BgsGame {
		const battleInfo: any = this.battleInfo || {};
		if (!battleInfo.playerBoard) {
			battleInfo.playerBoard = bgsInfo;
		} else if (!battleInfo.opponentBoard) {
			battleInfo.opponentBoard = bgsInfo;
			console.log('Set battle info', JSON.stringify(battleInfo, null, 4));
		} else {
			console.error('trying to set bgsinfo in full data', this, bgsInfo);
			return this;
		}
		return Object.assign(new BgsGame(), this, {
			battleInfo: battleInfo,
			battleInfoStatus: !battleInfo.opponentBoard ? 'empty' : 'waiting-for-result',
		} as BgsGame);
	}

	public resetBattleBoardInfo(): BgsGame {
		return Object.assign(new BgsGame(), this, {
			battleInfo: undefined,
			battleResult: undefined,
		} as BgsGame);
	}
}
