import { BgsBattleInfo } from '../bgs-battle-info';
import { BgsBattleSimulationResult } from '../bgs-battle-simulation-result';
import { BgsBoardInfo } from '../bgs-board-info';
import { BattlegroundsHero } from './battlegrounds-hero';
import { BattlegroundsPlayer } from './battlegrounds-player';

export class BattlegroundsState {
	readonly players: readonly BattlegroundsPlayer[] = [];
	readonly displayedPlayerCardId: string;
	readonly heroSelection: readonly BattlegroundsHero[] = [];
	readonly displayedHero: BattlegroundsHero;
	readonly battleInfo: BgsBattleInfo;
	readonly battleResult: BgsBattleSimulationResult;

	public static create(): BattlegroundsState {
		return new BattlegroundsState();
	}

	public update(newValue: BattlegroundsState): BattlegroundsState {
		return Object.assign(new BattlegroundsState(), this, newValue);
	}

	public getPlayer(cardId: string): BattlegroundsPlayer {
		return this.players.find(player => player.cardId === cardId) || BattlegroundsPlayer.create(cardId);
	}

	public updatePlayer(player: BattlegroundsPlayer): BattlegroundsState {
		const newPlayers: readonly BattlegroundsPlayer[] = [
			player,
			...this.players.filter(pl => pl.cardId !== player.cardId),
		].sort((a, b) => a.leaderboardPlace - b.leaderboardPlace);
		return Object.assign(new BattlegroundsState(), this, {
			players: newPlayers,
		} as BattlegroundsState);
	}

	public addBattleBoardInfo(bgsInfo: BgsBoardInfo): BattlegroundsState {
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
		return Object.assign(new BattlegroundsState(), this, {
			battleInfo: battleInfo,
		} as BattlegroundsState);
	}

	public resetBattleBoardInfo(): BattlegroundsState {
		return Object.assign(new BattlegroundsState(), this, {
			battleInfo: undefined,
		} as BattlegroundsState);
	}
}
